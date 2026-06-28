import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Param,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { BkashProvider } from './bkash.provider.js';
import { NagadProvider } from './nagad.provider.js';
import { PaymentService } from '../payment/payment.service.js';

@ApiTags('provider-callbacks')
@Controller('provider')
export class ProviderCallbackController {
  private readonly logger = new Logger(ProviderCallbackController.name);

  constructor(
    private readonly bkashProvider: BkashProvider,
    private readonly nagadProvider: NagadProvider,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('bkash/callback')
  @ApiOperation({ summary: 'bKash payment callback' })
  async bkashCallback(@Req() req: Request, @Res() res: Response) {
    const { paymentID, status } = req.body as { paymentID?: string; status?: string };

    if (!paymentID) {
      return res.redirect('/payment/failed');
    }

    this.logger.log(`bKash callback: paymentID=${paymentID}, status=${status}`);

    if (status === 'success') {
      const result = await this.bkashProvider.executePayment(paymentID);
      if (result.success) {
        await this.paymentService.completeProviderPayment('bkash', paymentID, true);
        return res.redirect(`/payment/success?ref=${paymentID}`);
      }
    }

    if (status === 'cancel') {
      await this.paymentService.completeProviderPayment('bkash', paymentID, false);
      return res.redirect('/payment/cancelled');
    }

    await this.paymentService.completeProviderPayment('bkash', paymentID, false);
    return res.redirect('/payment/failed');
  }

  @Post('nagad/callback')
  @ApiOperation({ summary: 'Nagad payment callback' })
  async nagadCallback(@Req() req: Request, @Res() res: Response) {
    const { payment_ref_id, status } = req.body as { payment_ref_id?: string; status?: string };

    if (!payment_ref_id) {
      return res.redirect('/payment/failed');
    }

    this.logger.log(`Nagad callback: ref=${payment_ref_id}, status=${status}`);

    if (status === 'Success') {
      const result = await this.nagadProvider.verifyPayment(payment_ref_id);
      if (result.success) {
        await this.paymentService.completeProviderPayment('nagad', payment_ref_id, true);
        return res.redirect(`/payment/success?ref=${payment_ref_id}`);
      }
    }

    await this.paymentService.completeProviderPayment('nagad', payment_ref_id, false);
    return res.redirect('/payment/failed');
  }
}
