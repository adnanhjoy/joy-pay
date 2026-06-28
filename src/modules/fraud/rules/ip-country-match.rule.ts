import { Injectable } from '@nestjs/common';
import type { BaseFraudRule, FraudContext, FraudRuleConfig, FraudCheckResult } from '../interfaces/fraud.interface.js';

@Injectable()
export class IpCountryMatchRule implements BaseFraudRule {
  getRuleType(): string {
    return 'IP_COUNTRY_MISMATCH';
  }

  async evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult> {
    if (!context.cardCountry || !context.ip) {
      return {
        ruleType: this.getRuleType(),
        score: 0,
        action: 'ALLOW',
        reason: 'Insufficient data for IP/country check',
      };
    }

    const allowedCountries = (ruleConfig.config.allowedCountries as string[]) ?? [];

    if (allowedCountries.length > 0 && !allowedCountries.includes(context.cardCountry)) {
      return {
        ruleType: this.getRuleType(),
        score: 70,
        action: ruleConfig.action,
        reason: `Card country ${context.cardCountry} not in allowed list`,
      };
    }

    return {
      ruleType: this.getRuleType(),
      score: 0,
      action: 'ALLOW',
      reason: `Card country ${context.cardCountry} is permitted`,
    };
  }
}
