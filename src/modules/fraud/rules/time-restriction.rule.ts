import { Injectable } from '@nestjs/common';
import type { BaseFraudRule, FraudContext, FraudRuleConfig, FraudCheckResult } from '../interfaces/fraud.interface.js';

@Injectable()
export class TimeRestrictionRule implements BaseFraudRule {
  getRuleType(): string {
    return 'TIME_RESTRICTION';
  }

  async evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult> {
    const blockedHours = (ruleConfig.config.blockedHours as number[]) ?? [0, 1, 2, 3, 4, 5];
    const blockedDays = (ruleConfig.config.blockedDays as number[]) ?? [];

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (blockedHours.includes(hour)) {
      return {
        ruleType: this.getRuleType(),
        score: 60,
        action: ruleConfig.action,
        reason: `Transaction attempted during restricted hour: ${hour}:00`,
      };
    }

    if (blockedDays.length > 0 && blockedDays.includes(day)) {
      return {
        ruleType: this.getRuleType(),
        score: 60,
        action: ruleConfig.action,
        reason: `Transaction attempted on restricted day: ${day}`,
      };
    }

    return {
      ruleType: this.getRuleType(),
      score: 0,
      action: 'ALLOW',
      reason: `Current hour ${hour} and day ${day} are permitted`,
    };
  }
}
