import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { ProviderType } from '../../provider/provider.factory.js';

export class CreatePaymentDto {
  @ApiProperty({ example: '100.50' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'BDT', default: 'BDT' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ example: 'bkash', enum: ['bkash', 'nagad', 'card'] })
  @IsEnum(['bkash', 'nagad', 'card'])
  @IsNotEmpty()
  provider!: ProviderType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
