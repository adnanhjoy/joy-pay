export interface PaymentProviderResponse {
  success: boolean;
  providerTransactionId: string;
  message?: string;
}

export interface PaymentProviderConfig {
  simulateDelay?: boolean;
  successRate?: number; // 0-100, percentage chance of success
}

export interface PaymentProvider {
  processPayment(
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse>;

  getProviderName(): string;
}
