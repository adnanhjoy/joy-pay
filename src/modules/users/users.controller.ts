import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('/')
  getUsers() {
    return {
      status: 200,
      success: true,
      message: 'Users retrieved successfully',
    };
  }
}
