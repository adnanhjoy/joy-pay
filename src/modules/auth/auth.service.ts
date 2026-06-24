import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email: dto.email, isActive: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (merchant.secretKey !== dto.secretKey) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: merchant.id, email: merchant.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      merchantId: merchant.id,
      email: merchant.email,
      name: merchant.name,
    };
  }
}
