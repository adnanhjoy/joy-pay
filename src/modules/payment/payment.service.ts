import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ProviderFactory, ProviderType } from '../provider/provider.factory.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { WebhookService } from '../webhook/webhook.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import type { FraudContext } from '../fraud/interfaces/fraud.interface.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private providerFactory: ProviderFactory,
    private transactionService: TransactionService,
    private webhookService: WebhookService,
    @Inject(forwardRef(() => FraudService))
    private fraudService: FraudService,
  ) {}

  async createPayment(
    merchantId: string,
    amount: number,
    currency: string,
    provider?: ProviderType,
    customerName?: string,
    customerEmail?: string,
    description?: string,
  ) {
    const session = await this.prisma.paymentSession.create({
      data: {
        merchantId,
        amount,
        currency,
        status: provider ? 'PENDING' : 'INITIATED',
        customerName,
        customerEmail,
        description,
        metadata: {
          providerRequired: !provider,
          createdAt: new Date().toISOString(),
        } as never,
      },
    });

    if (!provider) {
      this.logger.log(`Payment session created (no provider): ${session.id}`);
      return {
        sessionId: session.id,
        status: 'initiated',
        message: 'Payment session created. Select a payment method to continue.',
        availableProviders: this.providerFactory.getRealProviders(),
      };
    }

    const transaction = await this.transactionService.createTransaction(
      merchantId,
      session.id,
      amount,
      provider,
    );

    await this.prisma.paymentSession.update({
      where: { id: session.id },
      data: { status: 'PENDING' },
    });

    await this.transactionService.updateTransactionStatus(transaction.id, 'PENDING');

    const fraudContext: FraudContext = {
      amount,
      currency,
      merchantId,
      sessionId: session.id,
      transactionId: transaction.id,
      customerName,
      customerEmail,
    };

    const fraudResult = await this.fraudService.evaluatePayment(fraudContext);

    if (fraudResult.decision === 'BLOCK') {
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        'FAILED',
        undefined,
        `Fraud block: score ${fraudResult.riskScore}`,
      );
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException({
        message: 'Payment blocked by fraud detection',
        riskScore: fraudResult.riskScore,
      });
    }

    try {
      const providerResponse = await this.providerFactory.processPayment(
        provider,
        amount,
        merchantId,
        {
          customerName,
          customerEmail,
          isSandbox: !this.providerFactory.isRealProvider(provider),
        },
      );

      const finalStatus = providerResponse.success ? 'SUCCESS' : 'FAILED';
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        finalStatus,
        providerResponse.providerTransactionId,
        providerResponse.success ? undefined : providerResponse.message,
      );

      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: finalStatus },
      });

      if (providerResponse.success) {
        await this.webhookService.sendPaymentSuccess(
          merchantId,
          transaction.id,
          amount,
          provider,
          providerResponse.providerTransactionId,
        );
      } else {
        await this.webhookService.sendPaymentFailed(
          merchantId,
          transaction.id,
          amount,
          provider,
          providerResponse.message || 'Payment failed',
        );
      }

      return {
        sessionId: session.id,
        transactionId: transaction.id,
        redirectUrl: providerResponse.redirectUrl,
        status: finalStatus.toLowerCase(),
        message: providerResponse.message,
        fraudScore: fraudResult.riskScore,
        fraudDecision: fraudResult.decision,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payment processing error: ${errorMessage}`);

      await this.transactionService.updateTransactionStatus(
        transaction.id,
        'FAILED',
        undefined,
        errorMessage,
      );

      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  async confirmPayment(
    sessionId: string,
    merchantId: string,
    provider: ProviderType,
    cardDetails?: { cardNumber?: string; cardholderName?: string; expiry?: string; cvv?: string },
    ip?: string,
    userAgent?: string,
  ) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Payment session not found');
    }

    if (session.merchantId !== merchantId) {
      throw new BadRequestException('Unauthorized');
    }

    if (session.status !== 'INITIATED') {
      throw new BadRequestException(`Cannot confirm payment in status: ${session.status}`);
    }

    const availableProviders = this.providerFactory.getRealProviders();
    if (!availableProviders.includes(provider)) {
      throw new BadRequestException(`Invalid provider: ${provider}`);
    }

    const amount = Number(session.amount);

    const transaction = await this.transactionService.createTransaction(
      merchantId,
      sessionId,
      amount,
      provider,
    );

    await this.prisma.paymentSession.update({
      where: { id: sessionId },
      data: { status: 'PENDING' },
    });

    await this.transactionService.updateTransactionStatus(transaction.id, 'PENDING');

    const cardFirst6 = cardDetails?.cardNumber?.substring(0, 6);

    const fraudContext: FraudContext = {
      amount,
      currency: session.currency,
      merchantId,
      sessionId,
      transactionId: transaction.id,
      customerEmail: session.customerEmail ?? undefined,
      customerName: session.customerName ?? undefined,
      ip,
      userAgent,
      cardFirst6,
      cardLast4: cardDetails?.cardNumber?.slice(-4),
    };

    const fraudResult = await this.fraudService.evaluatePayment(fraudContext);

    if (fraudResult.decision === 'BLOCK') {
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        'FAILED',
        undefined,
        `Fraud block: score ${fraudResult.riskScore}`,
      );
      await this.prisma.paymentSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException({
        message: 'Payment blocked by fraud detection',
        riskScore: fraudResult.riskScore,
        fraudChecks: fraudResult.checks,
      });
    }

    try {
      const providerResponse = await this.providerFactory.processPayment(
        provider,
        amount,
        merchantId,
        {
          customerName: session.customerName ?? undefined,
          customerEmail: session.customerEmail ?? undefined,
          isSandbox: true,
        },
      );

      if (providerResponse.redirectUrl) {
        await this.transactionService.updateTransactionStatus(
          transaction.id,
          'PENDING',
          providerResponse.providerTransactionId,
        );

        return {
          sessionId,
          transactionId: transaction.id,
          redirectUrl: providerResponse.redirectUrl,
          status: 'pending',
          message: providerResponse.message,
          fraudScore: fraudResult.riskScore,
          fraudDecision: fraudResult.decision,
        };
      }

      const finalStatus = providerResponse.success ? 'SUCCESS' : 'FAILED';
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        finalStatus,
        providerResponse.providerTransactionId,
        providerResponse.success ? undefined : providerResponse.message,
      );

      await this.prisma.paymentSession.update({
        where: { id: sessionId },
        data: { status: finalStatus },
      });

      if (providerResponse.success) {
        await this.webhookService.sendPaymentSuccess(
          merchantId,
          transaction.id,
          amount,
          provider,
          providerResponse.providerTransactionId,
        );
      } else {
        await this.webhookService.sendPaymentFailed(
          merchantId,
          transaction.id,
          amount,
          provider,
          providerResponse.message || 'Payment failed',
        );
      }

      return {
        sessionId,
        transactionId: transaction.id,
        status: finalStatus.toLowerCase(),
        message: providerResponse.message,
        fraudScore: fraudResult.riskScore,
        fraudDecision: fraudResult.decision,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payment confirm error: ${errorMessage}`);

      await this.transactionService.updateTransactionStatus(
        transaction.id,
        'FAILED',
        undefined,
        errorMessage,
      );

      await this.prisma.paymentSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  async completeProviderPayment(
    provider: string,
    providerTransactionId: string,
    success: boolean,
  ) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        provider,
        providerTransactionId,
      },
    });

    if (!transaction) {
      this.logger.warn(`No transaction found for ${provider}:${providerTransactionId}`);
      return;
    }

    const finalStatus = success ? 'SUCCESS' : 'FAILED';

    await this.transactionService.updateTransactionStatus(
      transaction.id,
      finalStatus,
      providerTransactionId,
    );

    await this.prisma.paymentSession.update({
      where: { id: transaction.sessionId },
      data: { status: finalStatus },
    });

    if (success) {
      await this.webhookService.sendPaymentSuccess(
        transaction.merchantId,
        transaction.id,
        Number(transaction.amount),
        provider,
        providerTransactionId,
      );
    } else {
      await this.webhookService.sendPaymentFailed(
        transaction.merchantId,
        transaction.id,
        Number(transaction.amount),
        provider,
        'Payment failed at provider',
      );
    }

    this.logger.log(`Provider payment completed: ${provider}:${providerTransactionId} -> ${finalStatus}`);
  }

  async getPaymentSession(id: string) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { fraudCheck: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Payment session not found');
    }

    return {
      ...session,
      amount: Number(session.amount),
    };
  }

  async cancelPayment(id: string, merchantId: string) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Payment session not found');
    }

    if (session.merchantId !== merchantId) {
      throw new BadRequestException('Unauthorized to cancel this payment');
    }

    if (session.status === 'SUCCESS' || session.status === 'FAILED') {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    const updatedSession = await this.prisma.paymentSession.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.transaction.updateMany({
      where: { sessionId: id, status: { in: ['INITIATED', 'PENDING'] } },
      data: { status: 'CANCELLED' },
    });

    await this.webhookService.sendWebhook(merchantId, 'payment.cancelled', {
      event: 'payment.cancelled',
      sessionId: id,
      timestamp: new Date().toISOString(),
    });

    return {
      sessionId: updatedSession.id,
      status: 'cancelled',
      message: 'Payment cancelled successfully',
    };
  }

  async listPaymentSessions(
    merchantId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const sessions = await this.prisma.paymentSession.findMany({
      where: { merchantId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          include: { fraudCheck: true },
        },
      },
    });

    return sessions.map((s) => ({
      ...s,
      amount: Number(s.amount),
    }));
  }
}
