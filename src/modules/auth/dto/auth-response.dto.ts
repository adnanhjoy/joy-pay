import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class LoginResponseDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: AuthResponseDto, required: false })
  data?: AuthResponseDto;
}
