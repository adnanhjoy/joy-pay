import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard.js';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('x-api-key')
@ApiSecurity('x-signature')
@ApiSecurity('x-timestamp')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a payment session (with or without provider)' })
  @ApiResponse({ status: 201, description: 'Payment session created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req: Request & { merchant?: { id: string } },
  ) {
    return this.paymentService.createPayment(
      req.merchant!.id,
      dto.amount,
      dto.currency || 'BDT',
      dto.provider,
      dto.customerName,
      dto.customerEmail,
      dto.description,
    );
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment with selected provider' })
  @ApiResponse({ status: 200, description: 'Payment confirmed' })
  @ApiResponse({ status: 400, description: 'Fraud block or invalid provider' })
  async confirmPayment(
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
    @Req() req: Request & { merchant?: { id: string } },
  ) {
    return this.paymentService.confirmPayment(
      id,
      req.merchant!.id,
      dto.provider,
      dto.cardDetails,
      dto.ip,
      dto.userAgent,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment session by ID' })
  @ApiResponse({ status: 200, description: 'Payment session details' })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async getPayment(
    @Param('id') id: string,
    @Req() req: Request & { merchant?: { id: string } },
  ) {
    const session = await this.paymentService.getPaymentSession(id);
    if (session.merchantId !== req.merchant!.id) {
      return { error: 'Unauthorized to view this payment' };
    }
    return session;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a payment session' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel' })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async cancelPayment(
    @Param('id') id: string,
    @Req() req: Request & { merchant?: { id: string } },
  ) {
    return this.paymentService.cancelPayment(id, req.merchant!.id);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available payment providers' })
  async getProviders() {
    const providerFactory = await import('../provider/provider.factory.js');
    return {
      mfs: ['bkash', 'nagad'],
    };
  }
}
