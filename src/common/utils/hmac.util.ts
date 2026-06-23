import * as crypto from 'crypto';

export class HmacUtil {
  /**
   * Generate HMAC signature for request validation
   * @param payload - The request body/payload
   * @param timestamp - Unix timestamp in seconds
   * @param secretKey - Merchant's secret key
   * @returns Base64 encoded HMAC signature
   */
  static generateSignature(
    payload: string | object,
    timestamp: number,
    secretKey: string,
  ): string {
    const payloadString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    const dataToSign = `${payloadString}${timestamp}`;
    return crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign)
      .digest('base64');
  }

  /**
   * Verify HMAC signature from request
   * @param payload - The request body
   * @param timestamp - Timestamp from header
   * @param signature - Signature from header
   * @param secretKey - Merchant's secret key
   * @returns boolean indicating if signature is valid
   */
  static verifySignature(
    payload: string | object,
    timestamp: number,
    signature: string,
    secretKey: string,
  ): boolean {
    const expectedSignature = this.generateSignature(
      payload,
      timestamp,
      secretKey,
    );
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64'),
    );
  }

  /**
   * Validate timestamp to prevent replay attacks
   * Default tolerance: 5 minutes (300 seconds)
   * @param timestamp - Unix timestamp in seconds
   * @param toleranceSeconds - Tolerance window in seconds
   * @returns boolean indicating if timestamp is within tolerance
   */
  static isTimestampValid(
    timestamp: number,
    toleranceSeconds: number = 300,
  ): boolean {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTimestamp - timestamp);
    return timeDiff <= toleranceSeconds;
  }

  /**
   * Generate a random API key
   * @param prefix - Optional prefix (e.g., 'pk_live', 'pk_test')
   * @returns Generated API key
   */
  static generateApiKey(prefix: string = 'pk_live'): string {
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  /**
   * Generate a random secret key
   * @param prefix - Optional prefix (e.g., 'sk_live', 'sk_test')
   * @returns Generated secret key
   */
  static generateSecretKey(prefix: string = 'sk_live'): string {
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomPart}`;
  }
}
