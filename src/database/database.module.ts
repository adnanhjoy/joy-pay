import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { AppConfigService } from '../config/app-config.service.js';

@Global()
@Module({
  providers: [PrismaService, AppConfigService],
  exports: [PrismaService, AppConfigService],
})
export class DatabaseModule {}
