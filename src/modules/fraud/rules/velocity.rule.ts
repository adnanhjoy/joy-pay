import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import type { BaseFraudRule, FraudContext, FraudRuleConfig, FraudCheckResult } from '../interfaces/fraud.interface.js';

@Injectable()
export class VelocityRule implements BaseFraudRule {
  constructor(private prisma: PrismaService) {}

  getRuleType(): string {
    return 'VELOCITY';
  }

  async evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult> {
    const maxAttempts = (ruleConfig.config.maxAttempts as number) ?? 5;
    const timeWindowMin = (ruleConfig.config.timeWindowMin as number) ?? 10;

    const since = new Date(Date.now() - timeWindowMin * 60 * 1000);

    const recentCount = await this.prisma.transaction.count({
      where: {
        merchantId: context.merchantId,
        createdAt: { gte: since },
      },
    });

    if (recentCount >= maxAttempts) {
      const ratio = recentCount / maxAttempts;
      const score = Math.min(Math.round(ratio * 80), 80);
      return {
        ruleType: this.getRuleType(),
        score,
        action: ruleConfig.action,
        reason: `High velocity: ${recentCount} transactions in last ${timeWindowMin} minutes (max: ${maxAttempts})`,
      };
    }

    return {
      ruleType: this.getRuleType(),
      score: 0,
      action: 'ALLOW',
      reason: `Velocity OK: ${recentCount} transactions in last ${timeWindowMin} minutes`,
    };
  }
}
