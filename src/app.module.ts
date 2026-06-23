import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { ProviderModule } from './modules/provider/provider.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AuthModule,
    UsersModule,
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
