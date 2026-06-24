import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private config: ConfigService) {}

  get port(): number {
    return this.config.get<number>('port')!;
  }

  get nodeEnv(): string {
    return this.config.get<string>('nodeEnv')!;
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL!;
  }

  get redisHost(): string {
    return this.config.get<string>('redis.host')!;
  }

  get redisPort(): number {
    return this.config.get<number>('redis.port')!;
  }

  get redisPassword(): string {
    return this.config.get<string>('redis.password')!;
  }
}
