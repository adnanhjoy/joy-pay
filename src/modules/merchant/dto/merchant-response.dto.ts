import { ApiProperty } from '@nestjs/swagger';

export class MerchantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  apiKey: string;

  @ApiProperty()
  secretKey: string;

  @ApiProperty({ required: false })
  webhookUrl?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class MerchantCredentialsDto {
  @ApiProperty()
  apiKey: string;

  @ApiProperty()
  secretKey: string;
}
