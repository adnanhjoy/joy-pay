import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('login')
  login() {
    return {
      status: 200,
      success: true,
      message: 'login success',
    };
  }
}
