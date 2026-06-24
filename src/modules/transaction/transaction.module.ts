import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  providers: [TransactionService, PrismaService],
  exports: [TransactionService],
})
export class TransactionModule {}
