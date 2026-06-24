import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { MerchantModule } from './modules/merchant/merchant.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { TransactionModule } from './modules/transaction/transaction.module.js';
import { ProviderModule } from './modules/provider/provider.module.js';
import { WebhookModule } from './modules/webhook/webhook.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AuthModule,
    MerchantModule,
    PaymentModule,
    TransactionModule,
    ProviderModule,
    WebhookModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
