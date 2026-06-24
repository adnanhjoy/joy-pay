import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface.js';
import { MockBkashProvider } from './mock-bkash.provider.js';
import { MockNagadProvider } from './mock-nagad.provider.js';
import { MockCardProvider } from './mock-card.provider.js';

export type ProviderType = 'bkash' | 'nagad' | 'card';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    private readonly bkashProvider: MockBkashProvider,
    private readonly nagadProvider: MockNagadProvider,
    private readonly cardProvider: MockCardProvider,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      ['bkash', bkashProvider],
      ['nagad', nagadProvider],
      ['card', cardProvider],
    ]);
  }

  getProvider(providerType: ProviderType): PaymentProvider {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }
    return provider;
  }

  async processPayment(
    providerType: ProviderType,
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse> {
    const provider = this.getProvider(providerType);
    return provider.processPayment(amount, merchantId, config);
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys()) as ProviderType[];
  }
}
