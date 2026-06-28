import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { WebhookModule } from '../webhook/webhook.module.js';
import { ProviderModule } from '../provider/provider.module.js';
import { FraudModule } from '../fraud/fraud.module.js';

@Module({
  imports: [
    TransactionModule,
    WebhookModule,
    forwardRef(() => ProviderModule),
    forwardRef(() => FraudModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
