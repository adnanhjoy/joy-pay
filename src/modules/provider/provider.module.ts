import { Module } from '@nestjs/common';
import { MockBkashProvider } from './mock-bkash.provider.js';
import { MockNagadProvider } from './mock-nagad.provider.js';
import { MockCardProvider } from './mock-card.provider.js';
import { ProviderFactory } from './provider.factory.js';

@Module({
  providers: [
    MockBkashProvider,
    MockNagadProvider,
    MockCardProvider,
    ProviderFactory,
  ],
  exports: [ProviderFactory],
})
export class ProviderModule {}
