import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { FraudEngineService } from './fraud-engine.service.js';
import type { FraudContext, FraudResponse } from './interfaces/fraud.interface.js';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    private prisma: PrismaService,
    private fraudEngine: FraudEngineService,
  ) {}

  async evaluatePayment(context: FraudContext): Promise<FraudResponse> {
    const result = await this.fraudEngine.evaluate(context);
    await this.logFraudCheck(context.transactionId, result);
    return result;
  }

  private async logFraudCheck(transactionId: string, result: FraudResponse): Promise<void> {
    try {
      await this.prisma.fraudCheck.upsert({
        where: { transactionId },
        update: {
          riskScore: result.riskScore,
          decision: result.decision,
          checks: result.checks as never,
          metadata: { evaluatedAt: new Date().toISOString() },
        },
        create: {
          transactionId,
          riskScore: result.riskScore,
          decision: result.decision,
          checks: result.checks as never,
          metadata: { evaluatedAt: new Date().toISOString() },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log fraud check: ${error}`);
    }
  }

  async getMerchantRules(merchantId: string) {
    return this.prisma.fraudRule.findMany({
      where: { merchantId },
      orderBy: { priority: 'asc' },
    });
  }

  async createRule(merchantId: string, data: {
    ruleType: string;
    config: Record<string, unknown>;
    action: 'ALLOW' | 'FLAG' | 'BLOCK';
    priority?: number;
  }) {
    return this.prisma.fraudRule.create({
      data: {
        merchantId,
        ruleType: data.ruleType,
        config: data.config as never,
        action: data.action,
        priority: data.priority ?? 0,
      },
    });
  }

  async updateRule(merchantId: string, ruleId: string, data: {
    enabled?: boolean;
    config?: Record<string, unknown>;
    action?: 'ALLOW' | 'FLAG' | 'BLOCK';
    priority?: number;
  }) {
    const rule = await this.prisma.fraudRule.findFirst({
      where: { id: ruleId, merchantId },
    });
    if (!rule) return null;

    return this.prisma.fraudRule.update({
      where: { id: ruleId },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.config && { config: data.config as never }),
        ...(data.action && { action: data.action }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });
  }

  async deleteRule(merchantId: string, ruleId: string) {
    const rule = await this.prisma.fraudRule.findFirst({
      where: { id: ruleId, merchantId },
    });
    if (!rule) return null;

    return this.prisma.fraudRule.delete({ where: { id: ruleId } });
  }

  async getFraudCheck(transactionId: string) {
    return this.prisma.fraudCheck.findUnique({
      where: { transactionId },
    });
  }
}
