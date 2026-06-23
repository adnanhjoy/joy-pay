import { ApiProperty } from '@nestjs/swagger';

// Status type for Swagger
export type TransactionStatusType =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({
    enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
  })
  status: TransactionStatusType;

  @ApiProperty()
  provider: string;

  @ApiProperty({ required: false })
  providerTransactionId?: string;

  @ApiProperty({ required: false })
  failureReason?: string;

  @ApiProperty()
  createdAt: Date;
}
