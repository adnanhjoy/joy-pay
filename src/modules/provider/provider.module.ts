import { Module } from '@nestjs/common';
import { MockBkashProvider } from './mock-bkash.provider';
import { MockNagadProvider } from './mock-nagad.provider';
import { MockCardProvider } from './mock-card.provider';
import { ProviderFactory } from './provider.factory';

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
