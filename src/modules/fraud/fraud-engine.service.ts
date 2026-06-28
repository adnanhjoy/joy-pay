import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  FraudContext,
  FraudResponse,
  FraudCheckResult,
  FraudRuleConfig,
  BaseFraudRule,
} from './interfaces/fraud.interface.js';
import { VelocityRule } from './rules/velocity.rule.js';
import { AmountThresholdRule } from './rules/amount-threshold.rule.js';
import { BinBlocklistRule } from './rules/bin-blocklist.rule.js';
import { IpCountryMatchRule } from './rules/ip-country-match.rule.js';
import { TimeRestrictionRule } from './rules/time-restriction.rule.js';

@Injectable()
export class FraudEngineService {
  private readonly logger = new Logger(FraudEngineService.name);
  private readonly rules: Map<string, BaseFraudRule>;

  constructor(
    private prisma: PrismaService,
    velocityRule: VelocityRule,
    amountThresholdRule: AmountThresholdRule,
    binBlocklistRule: BinBlocklistRule,
    ipCountryMatchRule: IpCountryMatchRule,
    timeRestrictionRule: TimeRestrictionRule,
  ) {
    this.rules = new Map<string, BaseFraudRule>([
      [velocityRule.getRuleType(), velocityRule],
      [amountThresholdRule.getRuleType(), amountThresholdRule],
      [binBlocklistRule.getRuleType(), binBlocklistRule],
      [ipCountryMatchRule.getRuleType(), ipCountryMatchRule],
      [timeRestrictionRule.getRuleType(), timeRestrictionRule],
    ]);
  }

  async evaluate(context: FraudContext): Promise<FraudResponse> {
    const dbRules = await this.prisma.fraudRule.findMany({
      where: { merchantId: context.merchantId, enabled: true },
      orderBy: { priority: 'asc' },
    });

    const results: FraudCheckResult[] = [];

    for (const dbRule of dbRules) {
      const ruleImpl = this.rules.get(dbRule.ruleType);
      if (!ruleImpl) {
        this.logger.warn(`No implementation for rule type: ${dbRule.ruleType}`);
        continue;
      }

      const ruleConfig: FraudRuleConfig = {
        id: dbRule.id,
        merchantId: dbRule.merchantId,
        ruleType: dbRule.ruleType,
        enabled: dbRule.enabled,
        priority: dbRule.priority,
        config: dbRule.config as Record<string, unknown>,
        action: dbRule.action as 'ALLOW' | 'FLAG' | 'BLOCK',
      };

      try {
        const result = await ruleImpl.evaluate(context, ruleConfig);
        results.push(result);
      } catch (error) {
        this.logger.error(`Rule ${dbRule.ruleType} failed: ${error}`);
      }
    }

    const totalScore = Math.min(results.reduce((s, r) => s + r.score, 0), 100);
    const decision = this.getDecision(totalScore, results);

    this.logger.log(`Fraud check complete: score=${totalScore}, decision=${decision}`);

    return { riskScore: totalScore, decision, checks: results };
  }

  private getDecision(score: number, results: FraudCheckResult[]): 'ALLOW' | 'FLAG' | 'BLOCK' {
    const hasBlock = results.some((r) => r.action === 'BLOCK' && r.score >= 80);
    if (hasBlock) return 'BLOCK';
    if (score >= 80) return 'BLOCK';
    if (score >= 50) return 'FLAG';
    if (results.some((r) => r.action === 'FLAG' && r.score >= 50)) return 'FLAG';
    return 'ALLOW';
  }
}
