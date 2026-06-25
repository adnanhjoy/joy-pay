import {
  IsEmail,
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Tech Solutions Ltd' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'contact@joypay.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Tech Solutions Ltd' })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({ example: 'SOLE_PROPRIETORSHIP' })
  @IsString()
  @IsNotEmpty()
  businessType!: string;

  @ApiProperty({ example: 'TL-123456789' })
  @IsString()
  @IsNotEmpty()
  tradeLicense!: string;

  @ApiPropertyOptional({ example: 'RJSC-987654321' })
  @IsOptional()
  @IsString()
  businessRegNo?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  tinNo?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @IsString()
  @IsNotEmpty()
  businessAddress!: string;

  @ApiPropertyOptional({ example: 'https://joypay.com' })
  @IsOptional()
  @IsUrl()
  businessWebsite?: string;

  @ApiProperty({ example: 'E_COMMERCE' })
  @IsString()
  @IsNotEmpty()
  businessCategory!: string;

  @ApiPropertyOptional({
    example: 'https://joypay.com/webhook',
  })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
