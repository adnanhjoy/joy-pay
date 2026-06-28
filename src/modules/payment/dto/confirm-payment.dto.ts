import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProviderType } from '../../provider/provider.factory.js';

export class CardDetailsDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  @IsNotEmpty()
  cardNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  cardholderName!: string;

  @ApiProperty({ example: '12/28' })
  @IsString()
  @IsNotEmpty()
  expiry!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  cvv!: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'bkash', enum: ['bkash', 'nagad'] })
  @IsEnum(['bkash', 'nagad'])
  @IsNotEmpty()
  provider!: ProviderType;

  @ApiPropertyOptional({ type: CardDetailsDto })
  @IsOptional()
  cardDetails?: CardDetailsDto;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
