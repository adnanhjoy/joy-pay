import { Injectable } from '@nestjs/common';
import type { BaseFraudRule, FraudContext, FraudRuleConfig, FraudCheckResult } from '../interfaces/fraud.interface.js';

@Injectable()
export class BinBlocklistRule implements BaseFraudRule {
  getRuleType(): string {
    return 'BIN_BLOCK';
  }

  async evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult> {
    if (!context.cardFirst6) {
      return {
        ruleType: this.getRuleType(),
        score: 0,
        action: 'ALLOW',
        reason: 'No card BIN provided for check',
      };
    }

    const blockedBins = (ruleConfig.config.blockedBins as string[]) ?? [];

    if (blockedBins.includes(context.cardFirst6)) {
      return {
        ruleType: this.getRuleType(),
        score: 100,
        action: 'BLOCK',
        reason: `Card BIN ${context.cardFirst6} is in blocklist`,
      };
    }

    return {
      ruleType: this.getRuleType(),
      score: 0,
      action: 'ALLOW',
      reason: `Card BIN ${context.cardFirst6} is not blocked`,
    };
  }
}
