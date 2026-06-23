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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
@UseGuards(ApiKeyAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a payment session' })
  @ApiResponse({ status: 201, description: 'Payment session created' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid API key or signature',
  })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get payment session by ID' })
  @ApiResponse({ status: 200, description: 'Payment session details' })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async getPayment(
    @Param('id') id: string,
    @Req() req: Request & { merchant?: { id: string } },
  ) {
    const session = await this.paymentService.getPaymentSession(id);

    // Only allow merchant to view their own payments
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
}
