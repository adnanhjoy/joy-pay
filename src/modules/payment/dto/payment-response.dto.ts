import { ApiProperty } from '@nestjs/swagger';

// Status enum for Swagger - matches Prisma enum
export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export class PaymentSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({
    enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
  })
  status: PaymentStatus;

  @ApiProperty({ required: false })
  customerName?: string;

  @ApiProperty({ required: false })
  customerEmail?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  createdAt: Date;
}

export class CreatePaymentResponseDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  redirectUrl: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  message: string;
}
