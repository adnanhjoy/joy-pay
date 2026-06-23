import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [MerchantController],
  providers: [MerchantService, PrismaService],
  exports: [MerchantService],
})
export class MerchantModule {}
