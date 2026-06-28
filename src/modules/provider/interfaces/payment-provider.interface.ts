export interface PaymentProviderResponse {
  success: boolean;
  providerTransactionId: string;
  message?: string;
  redirectUrl?: string;
}

export interface PaymentProviderConfig {
  simulateDelay?: boolean;
  successRate?: number;
  isSandbox?: boolean;
  callbackUrl?: string;
  ipnUrl?: string;
  successUrl?: string;
  failUrl?: string;
  cancelUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantName?: string;
}

export interface PaymentProvider {
  processPayment(
    amount: number,
    merchantId: string,
    config?: PaymentProviderConfig,
  ): Promise<PaymentProviderResponse>;

  getProviderName(): string;
}
