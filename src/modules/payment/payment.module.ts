import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { WebhookModule } from '../webhook/webhook.module.js';
import { ProviderModule } from '../provider/provider.module.js';

@Module({
  imports: [TransactionModule, WebhookModule, ProviderModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
