import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [TransactionService, PrismaService],
  exports: [TransactionService],
})
export class TransactionModule {}
