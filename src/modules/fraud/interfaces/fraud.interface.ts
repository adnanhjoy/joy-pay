export type FraudActionType = 'ALLOW' | 'FLAG' | 'BLOCK';

export interface FraudRuleConfig {
  id: string;
  merchantId: string;
  ruleType: string;
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
  action: FraudActionType;
}

export interface FraudCheckResult {
  ruleType: string;
  score: number;
  action: FraudActionType;
  reason: string;
}

export interface FraudContext {
  amount: number;
  currency: string;
  merchantId: string;
  sessionId: string;
  transactionId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  ip?: string;
  userAgent?: string;
  cardFirst6?: string;
  cardLast4?: string;
  cardCountry?: string;
}

export interface FraudResponse {
  riskScore: number;
  decision: FraudActionType;
  checks: FraudCheckResult[];
}

export interface BaseFraudRule {
  evaluate(context: FraudContext, ruleConfig: FraudRuleConfig): Promise<FraudCheckResult>;
  getRuleType(): string;
}
