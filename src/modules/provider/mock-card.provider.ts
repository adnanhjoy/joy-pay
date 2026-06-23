import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface';
import { HmacUtil } from '../../common/utils/hmac.util';

@Injectable()
export class MockCardProvider implements PaymentProvider {
  private readonly logger = new Logger(MockCardProvider.name);

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
    const successRate = config?.successRate ?? 92;
    const shouldSucceed = Math.random() * 100 < successRate;

    const providerTransactionId = `Card_${HmacUtil.generateApiKey().substring(0, 12)}`;

    this.logger.log(
      `Mock Card payment processed for merchant ${merchantId}, amount: ${amount}, success: ${shouldSucceed}`,
    );

    return {
      success: shouldSucceed,
      providerTransactionId,
      message: shouldSucceed
        ? 'Payment successful via Card'
        : 'Payment failed - card declined',
    };
  }

  getProviderName(): string {
    return 'card';
  }
}
