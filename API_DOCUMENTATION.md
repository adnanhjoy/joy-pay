# Joy Pay API Documentation

Payment Gateway API - MVP

## Table of Contents
- [Authentication](#authentication)
  - [API Key + HMAC (for Payment APIs)](#api-key--hmac-for-payment-apis)
  - [JWT Auth (for Merchant Dashboard)](#jwt-auth-for-merchant-dashboard)
- [Merchant APIs](#merchant-apis)
- [Payment APIs](#payment-apis)
- [Transaction APIs](#transaction-apis)
- [Webhook APIs](#webhook-apis)
- [Supported Providers](#supported-providers)
- [Payment Status Lifecycle](#payment-status-lifecycle)
- [Webhook Events](#webhook-events)
- [Error Codes](#error-codes)
- [Testing with Swagger](#testing-with-swagger)

---

## Authentication

This API uses two authentication methods:

### API Key + HMAC (for Payment APIs)

All payment endpoints require three headers:

| Header | Description |
|--------|-------------|
| `x-api-key` | Merchant's public API key |
| `x-timestamp` | Unix timestamp in seconds |
| `x-signature` | HMAC_SHA256(payload + timestamp, secretKey) |

#### Generating HMAC Signature (Node.js)

```javascript
const crypto = require('crypto');

function generateSignature(payload, timestamp, secretKey) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const dataToSign = payloadString + timestamp;
  return crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
}

// Example
const payload = JSON.stringify({ amount: 100, provider: 'bkash' });
const timestamp = Math.floor(Date.now() / 1000);
const signature = generateSignature(payload, timestamp, 'your-secret-key');
```

#### Signature Verification Flow

1. Merchant gets `apiKey` and `secretKey` from merchant creation response
2. For each API request, merchant generates:
   - `x-timestamp`: Current Unix timestamp (seconds)
   - `x-signature`: HMAC-SHA256 of `(JSON.stringify(body) + timestamp)` using `secretKey`
3. Server verifies the timestamp (within 5 minutes tolerance) and signature
4. If valid, the request is authenticated as that merchant

---

### JWT Auth (for Merchant Dashboard)

Used for merchant dashboard/management endpoints.

#### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@techsolutions.com",
    "secretKey": "sk_live_your_secret_key"
  }'
```

**Response:**
```json
{
  "status": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "merchantId": "uuid",
    "email": "contact@techsolutions.com",
    "name": "Tech Solutions Ltd"
  }
}
```

Save the `accessToken` and use it as `Bearer token` in the `Authorization` header for protected routes.

#### Get Profile

```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

---

## Merchant APIs

### Create Merchant

Creates a new merchant account and returns API credentials.

```bash
curl -X POST http://localhost:3000/api/v1/merchant/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Company Ltd",
    "email": "contact@yourcompany.com",
    "webhookUrl": "https://yourcompany.com/webhook"
  }'
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Your Company Ltd",
  "email": "contact@yourcompany.com",
  "apiKey": "pk_live_abc123...",
  "secretKey": "sk_live_xyz789...",
  "webhookUrl": "https://yourcompany.com/webhook",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**After creating a merchant, save the API key and Secret key securely. They will not be shown again.**

### Get Merchant

```bash
curl -X GET http://localhost:3000/api/v1/merchant/{merchant_id}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Your Company Ltd",
  "email": "contact@yourcompany.com",
  "apiKey": "pk_live_abc123...",
  "secretKey": "sk_live_xyz789...",
  "webhookUrl": "https://yourcompany.com/webhook",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Payment APIs

All payment endpoints require [API Key + HMAC authentication](#api-key--hmac-for-payment-apis).

### Create Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature" \
  -d '{
    "amount": 100.50,
    "currency": "BDT",
    "provider": "bkash",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "description": "Order #12345"
  }'
```

**Response (201 Created):**
```json
{
  "sessionId": "uuid",
  "transactionId": "uuid",
  "redirectUrl": "http://localhost:3000/payments/uuid/result",
  "status": "success",
  "message": "Payment successful via bKash"
}
```

**Response (payment failed):**
```json
{
  "sessionId": "uuid",
  "transactionId": "uuid",
  "redirectUrl": "http://localhost:3000/payments/uuid/result",
  "status": "failed",
  "message": "Payment failed - insufficient balance"
}
```

### Get Payment Session

```bash
curl -X GET http://localhost:3000/api/v1/payments/{session_id} \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature"
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "merchantId": "uuid",
  "amount": 100.50,
  "currency": "BDT",
  "status": "SUCCESS",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "description": "Order #12345",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "transactions": [
    {
      "id": "uuid",
      "provider": "bkash",
      "status": "SUCCESS",
      "amount": 100.50
    }
  ]
}
```

### Cancel Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/{session_id}/cancel \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature"
```

**Response (200 OK):**
```json
{
  "sessionId": "uuid",
  "status": "cancelled",
  "message": "Payment cancelled successfully"
}
```

---

## Transaction APIs

### Get Transaction by ID

```bash
curl -X GET http://localhost:3000/api/v1/transactions/{transaction_id} \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature"
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "merchantId": "uuid",
  "sessionId": "uuid",
  "amount": 100.50,
  "status": "SUCCESS",
  "provider": "bkash",
  "providerTransactionId": "bKash_abc123...",
  "failureReason": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Webhook APIs

### Webhook Test Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"event": "test.success", "data": {"test": true}}'
```

**Response:**
```json
{
  "received": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "payload": {
    "event": "test.success",
    "data": { "test": true }
  }
}
```

---

## Supported Providers

| Provider | Description | Mock Success Rate |
|----------|-------------|-----------------|
| `bkash` | bKash mobile wallet | ~85% |
| `nagad` | Nagad mobile wallet | ~90% |
| `card` | Credit/Debit card | ~92% |

Note: These are mock providers with simulated delays (1-3 seconds) and random success/failure outcomes.

---

## Payment Status Lifecycle

| Status | Description |
|--------|-------------|
| `INITIATED` | Payment session created |
| `PENDING` | Payment being processed |
| `SUCCESS` | Payment completed successfully |
| `FAILED` | Payment failed |
| `CANCELLED` | Payment cancelled by merchant/user |

---

## Webhook Events

When a payment completes or fails, the merchant's webhook URL receives a POST request:

### Payment Success Webhook

```json
{
  "event": "payment.success",
  "transactionId": "uuid",
  "amount": 100.50,
  "provider": "bkash",
  "providerTransactionId": "bKash_abc123...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Payment Failed Webhook

```json
{
  "event": "payment.failed",
  "transactionId": "uuid",
  "amount": 100.50,
  "provider": "bkash",
  "failureReason": "Payment failed - insufficient balance",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Webhook Headers

| Header | Description |
|--------|-------------|
| `x-event-type` | Event type (e.g., payment.success) |
| `x-timestamp` | Unix timestamp |
| `x-signature` | HMAC signature for verification |

### Verify Webhook Signature (Merchant Side)

```javascript
function verifyWebhookSignature(payload, timestamp, signature, secretKey) {
  const payloadString = JSON.stringify(payload);
  const dataToSign = payloadString + timestamp;
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
  return signature === expectedSignature;
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input or operation not allowed |
| 401 | Unauthorized - Invalid API key, signature, or JWT token |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error |

---

## Testing with Swagger

Once the server is running, access the interactive Swagger documentation at:

```
http://localhost:3000/docs
```

### How to Test Each Endpoint

#### Step 1: Create a Merchant
1. Navigate to `POST /api/v1/merchant/create`
2. Click **Try it out**
3. Enter body:
   ```json
   {
     "name": "Test Merchant",
     "email": "test@example.com",
     "webhookUrl": "https://example.com/webhook"
   }
   ```
4. Click **Execute**
5. Copy the `apiKey` and `secretKey` from the response

#### Step 2: Generate HMAC Signature
For payment endpoints, you need to generate an HMAC signature. Here's a browser-ready JavaScript snippet:

```javascript
async function generateHmacSignature(payload, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const dataToSign = payloadString + timestamp;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return { timestamp, signature: base64 };
}

// Example usage:
// const { timestamp, signature } = await generateHmacSignature(
//   { amount: 100, currency: "BDT", provider: "bkash" },
//   "sk_live_your_secret_key"
// );
```

1. In Swagger UI, click the **Authorize** button (top-right)
2. Enter values for:
   - `x-api-key`: Your `pk_live_...` key
   - `x-timestamp`: Current Unix timestamp
   - `x-signature`: Generated HMAC signature
3. Click **Authorize**, then **Close**

#### Step 3: Test Payment APIs
1. Navigate to `POST /api/v1/payments/create`
2. Click **Try it out**
3. Enter body:
   ```json
   {
     "amount": 100,
     "currency": "BDT",
     "provider": "bkash",
     "customerName": "John Doe",
     "customerEmail": "john@example.com",
     "description": "Test payment"
   }
   ```
4. Click **Execute**
5. Observe the payment processing (1-3 second simulated delay)
6. View response showing success or failure

#### Step 4: Test JWT Auth (for dashboard)
1. Navigate to `POST /api/v1/auth/login`
2. Enter your merchant email and `secretKey`
3. Click **Execute**
4. Copy the `accessToken` from the response
5. In Swagger's Authorize dialog (top-right), enter the token in the `JWT-auth` field as: `Bearer <token>`
6. Now you can access `GET /api/v1/auth/profile`

#### Example Payment Response (Success)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "redirectUrl": "http://localhost:3000/payments/550e8400-e29b-41d4-a716-446655440000/result",
  "status": "success",
  "message": "Payment successful via bKash"
}
```

#### Example Payment Response (Failure)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "transactionId": "550e8400-e29b-41d4-a716-446655440003",
  "redirectUrl": "http://localhost:3000/payments/550e8400-e29b-41d4-a716-446655440002/result",
  "status": "failed",
  "message": "Payment failed - insufficient balance"
}
```
