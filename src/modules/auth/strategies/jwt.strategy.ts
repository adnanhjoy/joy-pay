import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') || 'super-secret-jwt-key',
    });
  }

  async validate(payload: JwtPayload) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: payload.sub, isActive: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid token');
    }

    return { id: merchant.id, email: merchant.email, name: merchant.name };
  }
}
