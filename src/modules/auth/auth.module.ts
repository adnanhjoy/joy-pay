import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret:
          configService.get<string>('jwt.secret') || 'super-secret-jwt-key',
        signOptions: {
          // ensure expiresIn matches JwtModuleOptions typing
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: (() => {
            const expiration = configService.get<number | string>(
              'jwt.expiration',
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return (typeof expiration === 'number'
              ? expiration
              : (expiration ?? '1d')) as unknown as any;
          })(),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
