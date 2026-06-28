import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentProviderResponse,
  PaymentProviderConfig,
} from './interfaces/payment-provider.interface.js';
import { ConfigService } from '@nestjs/config';
import { BkashProvider } from './bkash.provider.js';
import { NagadProvider } from './nagad.provider.js';
import { MockBkashProvider } from './mock-bkash.provider.js';
import { MockNagadProvider } from './mock-nagad.provider.js';
import { MockCardProvider } from './mock-card.provider.js';

export type ProviderType = 'bkash' | 'nagad' | 'mock_bkash' | 'mock_nagad' | 'mock_card';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    private readonly bkashProvider: BkashProvider,
    private readonly nagadProvider: NagadProvider,
    private readonly mockBkashProvider: MockBkashProvider,
    private readonly mockNagadProvider: MockNagadProvider,
    private readonly mockCardProvider: MockCardProvider,
    private readonly config: ConfigService,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      ['bkash', bkashProvider],
      ['nagad', nagadProvider],
      ['mock_bkash', mockBkashProvider],
      ['mock_nagad', mockNagadProvider],
      ['mock_card', mockCardProvider],
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
    const isSandbox = this.config.get<string>('PAYMENT_SANDBOX') !== 'false';
    if (isSandbox) {
      return ['mock_bkash', 'mock_nagad', 'mock_card'];
    }
    return ['bkash', 'nagad'];
  }

  getRealProviders(): ProviderType[] {
    return ['bkash', 'nagad'];
  }

  isRealProvider(providerType: string): boolean {
    return ['bkash', 'nagad'].includes(providerType);
  }
}
