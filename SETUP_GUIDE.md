# Joy Pay - Payment Gateway Backend

A Stripe/SSLCommerz-like payment gateway backend built with NestJS, Prisma, and PostgreSQL.

## Features

- Merchant registration with API key/secret key generation
- HMAC-based request authentication
- Payment session management
- Mock payment providers (bKash, Nagad, Card)
- Transaction tracking (ledger-style)
- Webhook system with retry mechanism
- Swagger API documentation

## Prerequisites

- Node.js 24.x
- PostgreSQL 14+
- npm 11.x

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Update the DATABASE_URL with your PostgreSQL connection string.

### 3. Database Migration

```bash
npx prisma migrate dev --name init
```

Or for production:

```bash
npx prisma migrate deploy
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Start Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

## Project Structure

```
src/
├── modules/
│   ├── merchant/          # Merchant registration & management
│   ├── payment/           # Payment session APIs
│   ├── transaction/       # Transaction tracking
│   ├── provider/          # Mock payment providers
│   ├── webhook/           # Webhook delivery service
│   └── auth/              # Authentication module (existing)
├── common/
│   ├── guards/            # API key auth guard
│   ├── decorators/        # Custom decorators
│   ├── utils/             # HMAC utility
│   └── interceptors/      # (empty - for future use)
├── config/
│   └── configuration.ts   # Environment config
├── database/
│   └── prisma.service.ts  # Prisma client
└── generated/
    └── prisma/            # Generated Prisma client
```

## Testing the API

### 1. Create a Merchant

```bash
curl -X POST http://localhost:3000/api/v1/merchant/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "test@company.com",
    "webhookUrl": "http://localhost:3000/api/v1/webhook/test"
  }'
```

Save the returned `apiKey` and `secretKey`.

### 2. Generate Signature (Node.js Helper)

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({ amount: 100, provider: 'bkash' });
const timestamp = Math.floor(Date.now() / 1000);
const secretKey = 'sk_live_your_secret_key_here';

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(payload + timestamp)
  .digest('base64');

console.log(signature);
```

### 3. Create a Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: pk_live_your_api_key" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "x-signature: $SIGNATURE" \
  -d '{
    "amount": 100.00,
    "provider": "bkash"
  }'
```

## Mock Provider Behavior

Each mock provider simulates:
- 1-3 second processing delay
- Random success/failure based on configured success rate:
  - bKash: ~85% success
  - Nagad: ~90% success
  - Card: ~92% success

## Security Notes

- API keys are stored in plain text (use hashing in production)
- Timestamps must be within 5 minutes to prevent replay attacks
- All sensitive operations require HMAC signature verification
- Webhook signatures use merchant secret key for verification