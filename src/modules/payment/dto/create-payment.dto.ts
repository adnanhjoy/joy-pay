import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProviderType } from '../../provider/provider.factory.js';

export class CreatePaymentDto {
  @ApiProperty({ example: '100.50' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'BDT', default: 'BDT' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'bkash', enum: ['bkash', 'nagad', 'mock_bkash', 'mock_nagad', 'mock_card'] })
  @IsEnum(['bkash', 'nagad', 'mock_bkash', 'mock_nagad', 'mock_card'])
  @IsOptional()
  provider?: ProviderType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
