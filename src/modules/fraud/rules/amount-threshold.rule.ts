import { Injectable } from '@nestjs/common';
import type { BaseFraudRule, FraudContext, FraudRuleConfig, FraudCheckResult } from '../interfaces/fraud.interface.js';

@Injectable()
export class AmountThresholdRule implements BaseFraudRule {
  getRuleType(): string {
    return 'AMOUNT_THRESHOLD';
  }

  async evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult> {
    const maxAmount = (ruleConfig.config.maxAmount as number) ?? 100000;
    const threshold = (ruleConfig.config.threshold as number) ?? maxAmount * 0.8;

    if (context.amount > maxAmount) {
      return {
        ruleType: this.getRuleType(),
        score: 90,
        action: ruleConfig.action,
        reason: `Amount ${context.amount} exceeds max allowed ${maxAmount}`,
      };
    }

    if (context.amount > threshold) {
      const pct = (context.amount / maxAmount) * 100;
      const score = Math.min(Math.round(pct), 60);
      return {
        ruleType: this.getRuleType(),
        score,
        action: 'FLAG',
        reason: `Amount ${context.amount} is near threshold ${threshold} (${Math.round(pct)}% of max)`,
      };
    }

    return {
      ruleType: this.getRuleType(),
      score: 0,
      action: 'ALLOW',
      reason: `Amount ${context.amount} within limits`,
    };
  }
}
