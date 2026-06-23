# Joy Pay API Documentation

Payment Gateway API - MVP

## Table of Contents
- [Authentication](#authentication)
- [Merchant APIs](#merchant-apis)
- [Payment APIs](#payment-apis)
- [Webhook APIs](#webhook-apis)
- [Error Codes](#error-codes)

---

## Authentication

All protected endpoints require three headers:

| Header | Description |
|--------|-------------|
| `x-api-key` | Merchant's public API key |
| `x-timestamp` | Unix timestamp in seconds |
| `x-signature` | HMAC_SHA256(payload + timestamp, secretKey) |

### Generating HMAC Signature (Node.js)

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

---

## Merchant APIs

### Create Merchant

```bash
curl -X POST http://localhost:3000/api/v1/merchant/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Company Ltd",
    "email": "contact@yourcompany.com",
    "webhookUrl": "https://yourcompany.com/webhook"
  }'
```

**Response:**
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

---

## Payment APIs

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

**Response:**
```json
{
  "sessionId": "uuid",
  "transactionId": "uuid",
  "redirectUrl": "http://localhost:3000/payments/uuid/result",
  "status": "pending",
  "message": "Payment initiated"
}
```

### Get Payment Session

```bash
curl -X GET http://localhost:3000/api/v1/payments/{session_id} \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature"
```

**Response:**
```json
{
  "id": "uuid",
  "merchantId": "uuid",
  "amount": "100.50",
  "currency": "BDT",
  "status": "SUCCESS",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "description": "Order #12345",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "transactions": [...]
}
```

### Cancel Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/{session_id}/cancel \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $(date +%s)" \
  -H "x-signature: generated_signature"
```

**Response:**
```json
{
  "sessionId": "uuid",
  "status": "cancelled",
  "message": "Payment cancelled successfully"
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

When a payment completes, the merchant's webhook URL receives:

```json
{
  "event": "payment.success",
  "transactionId": "uuid",
  "amount": "100.50",
  "provider": "bkash",
  "providerTransactionId": "bKash_abc123...",
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
  const expectedSignature = generateSignature(payload, timestamp, secretKey);
  return signature === expectedSignature;
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Invalid API key or signature |
| 404 | NOT_FOUND | Resource not found |
| 400 | BAD_REQUEST | Invalid input or operation not allowed |
| 409 | CONFLICT | Resource already exists |
| 500 | INTERNAL_ERROR | Server error |

---