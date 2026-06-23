import {
  IsEmail,
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Tech Solutions Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'contact@techsolutions.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'https://techsolutions.com/webhook',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
