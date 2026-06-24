import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service.js';
import { MerchantController } from './merchant.controller.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  controllers: [MerchantController],
  providers: [MerchantService, PrismaService],
  exports: [MerchantService],
})
export class MerchantModule {}
