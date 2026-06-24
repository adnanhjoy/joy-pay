import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { HmacUtil } from '../../common/utils/hmac.util.js';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly MAX_RETRIES = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Send webhook to merchant with retry logic
   */
  async sendWebhook(
    merchantId: string,
    eventType: string,
    payload: Record<string, unknown>,
    retryCount: number = 0,
  ): Promise<void> {
    // Get merchant with webhook URL
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant?.webhookUrl) {
      this.logger.warn(`No webhook URL configured for merchant ${merchantId}`);
      return;
    }

    // Create webhook log entry
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        merchantId,
        eventType,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload: payload as any,
        status: 'PENDING',
        retryCount,
      },
    });

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = HmacUtil.generateSignature(
        JSON.stringify(payload),
        timestamp,
        merchant.secretKey,
      );

      const response: AxiosResponse = await axios.post(
        merchant.webhookUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Timestamp': timestamp.toString(),
            'X-Signature': signature,
            'X-Event-Type': eventType,
          },
          timeout: 10000,
        },
      );

      // Update webhook log on success
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'SENT',
          response: JSON.stringify(response.data),
          responseCode: response.status,
        },
      });

      this.logger.log(
        `Webhook sent successfully to ${merchant.webhookUrl} for event ${eventType}`,
      );
    } catch (error: any) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Webhook failed to ${merchant.webhookUrl} for event ${eventType}: ${error.message}`,
      );

      // Update webhook log on failure
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'FAILED',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          response: error.message,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          responseCode: error.response?.status,
        },
      });

      // Retry with exponential backoff
      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));

        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { status: 'RETRIED' },
        });

        await this.sendWebhook(merchantId, eventType, payload, retryCount + 1);
      } else {
        this.logger.error(
          `Webhook failed after ${this.MAX_RETRIES} retries for merchant ${merchantId}`,
        );
      }
    }
  }

  /**
   * Send payment success webhook
   */
  async sendPaymentSuccess(
    merchantId: string,
    transactionId: string,
    amount: number,
    provider: string,
    providerTransactionId: string,
  ): Promise<void> {
    const payload = {
      event: 'payment.success',
      transactionId,
      amount,
      provider,
      providerTransactionId,
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook(merchantId, 'payment.success', payload);
  }

  /**
   * Send payment failure webhook
   */
  async sendPaymentFailed(
    merchantId: string,
    transactionId: string,
    amount: number,
    provider: string,
    failureReason: string,
  ): Promise<void> {
    const payload = {
      event: 'payment.failed',
      transactionId,
      amount,
      provider,
      failureReason,
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook(merchantId, 'payment.failed', payload);
  }

  /**
   * Get webhook logs for a merchant
   */
  async getWebhookLogs(merchantId: string, limit: number = 50) {
    return this.prisma.webhookLog.findMany({
      where: { merchantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
