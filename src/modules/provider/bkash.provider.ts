import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface.js';

@Injectable()
export class BkashProvider implements PaymentProvider {
  private readonly logger = new Logger(BkashProvider.name);
  private readonly sandboxBaseUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
  private readonly prodBaseUrl = 'https://tokenized.pay.bka.sh/v1.2.0-beta';

  constructor(private config: ConfigService) {}

  getProviderName(): string {
    return 'bkash';
  }

  private getBaseUrl(): string {
    return this.config.get<string>('BKASH_SANDBOX') === 'true'
      ? this.sandboxBaseUrl
      : this.prodBaseUrl;
  }

  private async grantToken(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const appKey = this.config.get<string>('BKASH_APP_KEY')!;
    const appSecret = this.config.get<string>('BKASH_APP_SECRET')!;

    try {
      const response = await axios.post(
        `${baseUrl}/tokenized/checkout/token/grant`,
        { app_key: appKey, app_secret: appSecret },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            username: this.config.get<string>('BKASH_USERNAME')!,
            password: this.config.get<string>('BKASH_PASSWORD')!,
          },
          timeout: 30000,
        },
      );

      this.logger.log('bKash token granted successfully');
      return response.data.id_token as string;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`bKash token grant failed: ${msg}`);
      throw new HttpException('bKash authentication failed', HttpStatus.BAD_GATEWAY);
    }
  }

  async processPayment(
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse> {
    try {
      const token = await this.grantToken();
      const baseUrl = this.getBaseUrl();
      const merchantInvoiceNumber = `INV-${merchantId.substring(0, 8)}-${Date.now()}`;

      const callbackUrl = config?.callbackUrl
        ?? `${this.config.get<string>('JOYPAY_BASE_URL', 'http://localhost:3000')}/api/v1/provider/bkash/callback`;

      const response = await axios.post(
        `${baseUrl}/tokenized/checkout/create`,
        {
          mode: '0011',
          payerReference: merchantId.substring(0, 20),
          callbackURL: callbackUrl,
          amount: amount.toString(),
          currency: 'BDT',
          merchantInvoiceNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.config.get<string>('BKASH_APP_KEY')!,
          },
          timeout: 30000,
        },
      );

      this.logger.log(`bKash payment created: ${response.data.paymentID}`);

      return {
        success: true,
        providerTransactionId: response.data.paymentID as string,
        redirectUrl: response.data.bkashURL as string,
        message: 'Redirecting to bKash...',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`bKash payment failed: ${msg}`);
      return {
        success: false,
        providerTransactionId: '',
        message: `bKash payment failed: ${msg}`,
      };
    }
  }

  async executePayment(paymentId: string): Promise<PaymentProviderResponse> {
    try {
      const token = await this.grantToken();
      const baseUrl = this.getBaseUrl();

      const response = await axios.post(
        `${baseUrl}/tokenized/checkout/execute`,
        { paymentID: paymentId },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.config.get<string>('BKASH_APP_KEY')!,
          },
          timeout: 30000,
        },
      );

      const isSuccess = response.data.statusCode === '0000';

      this.logger.log(`bKash execute: ${paymentId} -> ${isSuccess ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: isSuccess,
        providerTransactionId: response.data.trxID as string ?? paymentId,
        message: isSuccess
          ? 'Payment successful via bKash'
          : `bKash payment failed: ${response.data.statusMessage}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`bKash execute failed: ${msg}`);
      return {
        success: false,
        providerTransactionId: paymentId,
        message: `bKash execute failed: ${msg}`,
      };
    }
  }

  async queryPayment(paymentId: string): Promise<PaymentProviderResponse> {
    try {
      const token = await this.grantToken();
      const baseUrl = this.getBaseUrl();

      const response = await axios.get(
        `${baseUrl}/tokenized/checkout/payment/query`,
        {
          params: { paymentID: paymentId },
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'X-APP-Key': this.config.get<string>('BKASH_APP_KEY')!,
          },
          timeout: 30000,
        },
      );

      return {
        success: response.data.transactionStatus === 'Completed',
        providerTransactionId: paymentId,
        message: `bKash payment status: ${response.data.transactionStatus}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`bKash query failed: ${msg}`);
      return {
        success: false,
        providerTransactionId: paymentId,
        message: `bKash query failed: ${msg}`,
      };
    }
  }
}
