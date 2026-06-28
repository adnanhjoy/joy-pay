import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from '../payment/payment.module.js';
import { BkashProvider } from './bkash.provider.js';
import { NagadProvider } from './nagad.provider.js';
import { MockBkashProvider } from './mock-bkash.provider.js';
import { MockNagadProvider } from './mock-nagad.provider.js';
import { MockCardProvider } from './mock-card.provider.js';
import { ProviderFactory } from './provider.factory.js';
import { ProviderCallbackController } from './provider-callback.controller.js';

@Module({
  imports: [ConfigModule, forwardRef(() => PaymentModule)],
  controllers: [ProviderCallbackController],
  providers: [
    BkashProvider,
    NagadProvider,
    MockBkashProvider,
    MockNagadProvider,
    MockCardProvider,
    ProviderFactory,
  ],
  exports: [ProviderFactory, BkashProvider, NagadProvider],
})
export class ProviderModule {}
