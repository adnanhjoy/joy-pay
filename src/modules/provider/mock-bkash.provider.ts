import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface';
import { HmacUtil } from '../../common/utils/hmac.util';

@Injectable()
export class MockBkashProvider implements PaymentProvider {
  private readonly logger = new Logger(MockBkashProvider.name);

  async processPayment(
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse> {
    // Simulate network delay (1-3 seconds)
    if (config?.simulateDelay !== false) {
      const delay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Determine success based on config
    const successRate = config?.successRate ?? 85;
    const shouldSucceed = Math.random() * 100 < successRate;

    const providerTransactionId = `bKash_${HmacUtil.generateApiKey().substring(0, 12)}`;

    this.logger.log(
      `Mock bKash payment processed for merchant ${merchantId}, amount: ${amount}, success: ${shouldSucceed}`,
    );

    return {
      success: shouldSucceed,
      providerTransactionId,
      message: shouldSucceed
        ? 'Payment successful via bKash'
        : 'Payment failed - insufficient balance',
    };
  }

  getProviderName(): string {
    return 'bkash';
  }
}
