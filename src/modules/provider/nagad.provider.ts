import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface.js';

@Injectable()
export class NagadProvider implements PaymentProvider {
  private readonly logger = new Logger(NagadProvider.name);
  private readonly sandboxBaseUrl = 'https://sandbox.mynagad.com/api/dfs';
  private readonly prodBaseUrl = 'https://api.mynagad.com/api/dfs';

  constructor(private config: ConfigService) {}

  getProviderName(): string {
    return 'nagad';
  }

  private getBaseUrl(): string {
    return this.config.get<string>('NAGAD_SANDBOX') === 'true'
      ? this.sandboxBaseUrl
      : this.prodBaseUrl;
  }

  private getMerchantId(): string {
    return this.config.get<string>('NAGAD_MERCHANT_ID') ?? '';
  }

  private getPrivateKey(): string {
    return this.config.get<string>('NAGAD_MERCHANT_PRIVATE_KEY') ?? '';
  }

  private getPgPublicKey(): string {
    return this.config.get<string>('NAGAD_PG_PUBLIC_KEY') ?? '';
  }

  private signData(data: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(this.getPrivateKey(), 'base64');
  }

  private encryptSensitiveData(data: string): string {
    const publicKey = this.getPgPublicKey();
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    );
    return encrypted.toString('base64');
  }

  async processPayment(
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse> {
    try {
      const baseUrl = this.getBaseUrl();
      const merchantIdStr = this.getMerchantId();
      const orderId = `ORDER_${Date.now()}_${merchantId.substring(0, 6)}`;

      const callbackUrl = config?.callbackUrl
        ?? `${this.config.get<string>('JOYPAY_BASE_URL', 'http://localhost:3000')}/api/v1/provider/nagad/callback`;

      const requestBody = {
        merchantId: merchantIdStr,
        orderId,
        amount: amount.toString(),
        currency: 'BDT',
        callbackUrl,
        merchantName: 'Joy Pay',
        merchantDetails: `Merchant: ${merchantId}`,
      };

      const dataString = JSON.stringify(requestBody);
      const sensitiveData = this.encryptSensitiveData(dataString);
      const signature = this.signData(dataString);

      const response = await axios.post(
        `${baseUrl}/checkout/initialize`,
        {
          merchantId: merchantIdStr,
          orderId,
          amount: amount.toString(),
          currency: '050',
          callbackUrl,
          merchantName: 'Joy Pay',
          paymentType: 'WEB_BLOCK',
          encryptedData: sensitiveData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Merchant-ID': merchantIdStr,
          },
          timeout: 30000,
        },
      );

      this.logger.log(`Nagad payment initialized: ${orderId}`);

      return {
        success: true,
        providerTransactionId: orderId,
        redirectUrl: response.data.callbackUrl ?? response.data.gatewayUrl,
        message: 'Redirecting to Nagad...',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Nagad payment failed: ${msg}`);
      return {
        success: false,
        providerTransactionId: '',
        message: `Nagad payment failed: ${msg}`,
      };
    }
  }

  async verifyPayment(paymentRefId: string): Promise<PaymentProviderResponse> {
    try {
      const baseUrl = this.getBaseUrl();
      const merchantIdStr = this.getMerchantId();
      const signature = this.signData(JSON.stringify({ paymentRefId }));

      const response = await axios.post(
        `${baseUrl}/checkout/verify`,
        { paymentRefId, merchantId: merchantIdStr, signature },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Merchant-ID': merchantIdStr,
          },
          timeout: 30000,
        },
      );

      const isSuccess = response.data.status === 'Success';

      this.logger.log(`Nagad verify: ${paymentRefId} -> ${isSuccess ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: isSuccess,
        providerTransactionId: paymentRefId,
        message: isSuccess
          ? 'Payment successful via Nagad'
          : `Nagad payment failed: ${response.data.status}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Nagad verify failed: ${msg}`);
      return {
        success: false,
        providerTransactionId: paymentRefId,
        message: `Nagad verify failed: ${msg}`,
      };
    }
  }
}
