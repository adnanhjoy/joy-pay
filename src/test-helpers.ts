/**
 * Test helper for generating HMAC signatures
 * Use this for testing API endpoints
 */
import * as crypto from 'crypto';

export function generateSignature(
  payload: string | object,
  timestamp: number,
  secretKey: string,
): string {
  const payloadString =
    typeof payload === 'string' ? payload : JSON.stringify(payload);
  const dataToSign = payloadString + timestamp;
  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('base64');
}

export function generateApiHeaders(
  payload: string | object,
  apiKey: string,
  secretKey: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(payload, timestamp, secretKey);

  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-timestamp': timestamp.toString(),
    'x-signature': signature,
  };
}

// Example usage for curl command generation
export function generateCurlCommand(
  endpoint: string,
  method: string,
  payload: string | object,
  apiKey: string,
  secretKey: string,
): string {
  const headers = generateApiHeaders(payload, apiKey, secretKey);
  const headerString = Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(' \\\n  ');

  const payloadString =
    typeof payload === 'string' ? payload : JSON.stringify(payload);

  return `curl -X ${method} http://localhost:3000/api/v1${endpoint} \\
  ${headerString} \\
  -d '${payloadString}'`;
}
