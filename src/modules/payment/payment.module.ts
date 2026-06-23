import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TransactionModule } from '../transaction/transaction.module';
import { WebhookModule } from '../webhook/webhook.module';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [TransactionModule, WebhookModule, ProviderModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
