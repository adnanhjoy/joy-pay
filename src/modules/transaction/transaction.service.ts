import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { TransactionStatus } from '@prisma/client';
import { TransactionResponseDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new transaction record
   */
  async createTransaction(
    merchantId: string,
    sessionId: string,
    amount: number,
    provider: string,
  ) {
    const transaction = await this.prisma.transaction.create({
      data: {
        merchantId,
        sessionId,
        amount,
        provider,
        status: 'INITIATED',
      },
    });

    this.logger.log(
      `Transaction created: ${transaction.id} for session ${sessionId}`,
    );

    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    providerTransactionId?: string,
    failureReason?: string,
  ) {
    const transaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        providerTransactionId,
        failureReason,
      },
    });

    this.logger.log(
      `Transaction ${transactionId} updated to status: ${status}`,
    );

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<TransactionResponseDto | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        merchant: true,
        session: true,
      },
    });

    if (!transaction) {
      return null;
    }

    return {
      id: transaction.id,
      merchantId: transaction.merchantId,
      sessionId: transaction.sessionId,
      amount: Number(transaction.amount),
      status: transaction.status,
      provider: transaction.provider,
      providerTransactionId: transaction.providerTransactionId || undefined,
      failureReason: transaction.failureReason || undefined,
      createdAt: transaction.createdAt,
    };
  }

  /**
   * Get all transactions for a merchant
   */
  async getMerchantTransactions(
    merchantId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const transactions = await this.prisma.transaction.findMany({
      where: { merchantId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));
  }

  /**
   * Get transactions by session ID
   */
  async getSessionTransactions(sessionId: string) {
    return this.prisma.transaction.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
