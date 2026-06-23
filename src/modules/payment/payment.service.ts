import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProviderFactory, ProviderType } from '../provider/provider.factory';
import { TransactionService } from '../transaction/transaction.service';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private providerFactory: ProviderFactory,
    private transactionService: TransactionService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Create a payment session and initiate payment
   */
  async createPayment(
    merchantId: string,
    amount: number,
    currency: string,
    provider: ProviderType,
    customerName?: string,
    customerEmail?: string,
    description?: string,
  ) {
    // Validate provider
    const availableProviders = this.providerFactory.getAvailableProviders();
    if (!availableProviders.includes(provider)) {
      throw new BadRequestException(`Invalid provider: ${provider}`);
    }

    // Create payment session
    const session = await this.prisma.paymentSession.create({
      data: {
        merchantId,
        amount,
        currency,
        status: 'INITIATED',
        customerName,
        customerEmail,
        description,
      },
    });

    // Create transaction record
    const transaction = await this.transactionService.createTransaction(
      merchantId,
      session.id,
      amount,
      provider,
    );

    try {
      // Update session status to pending
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'PENDING' },
      });

      // Update transaction status to pending
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        'PENDING',
      );

      // Process payment with mock provider
      const providerResponse = await this.providerFactory.processPayment(
        provider,
        amount,
        merchantId,
      );

      // Update transaction based on provider response
      const finalStatus = providerResponse.success ? 'SUCCESS' : 'FAILED';
      await this.transactionService.updateTransactionStatus(
        transaction.id,
        finalStatus,
        providerResponse.providerTransactionId,
        providerResponse.success ? undefined : providerResponse.message,
      );

      // Update session status
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: finalStatus },
      });

      // Send webhook notification
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
        redirectUrl: `http://localhost:3000/payments/${session.id}/result`,
        status: finalStatus.toLowerCase(),
        message: providerResponse.message,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payment processing error: ${errorMessage}`);

      // Update transaction status to failed on error
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

  /**
   * Get payment session by ID
   */
  async getPaymentSession(id: string) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id },
      include: {
        transactions: true,
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

  /**
   * Cancel a payment session
   */
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

    // Update session status
    const updatedSession = await this.prisma.paymentSession.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Update associated transactions
    await this.prisma.transaction.updateMany({
      where: { sessionId: id, status: { in: ['INITIATED', 'PENDING'] } },
      data: { status: 'CANCELLED' },
    });

    // Send cancel webhook
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

  /**
   * List payment sessions for a merchant
   */
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
    });

    return sessions.map((s) => ({
      ...s,
      amount: Number(s.amount),
    }));
  }
}
