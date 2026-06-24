# Joy Pay Backend API

[![API Documentation](https://img.shields.io/badge/API-Documentation-blue?style=for-the-badge)](./API_DOCUMENTATION.md)
[![Swagger UI](https://img.shields.io/badge/Swagger-UI-green?style=for-the-badge)](http://localhost:3000/docs)

Payment Gateway API built with NestJS, Prisma ORM, PostgreSQL (Supabase), and TypeScript.

## Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL (Supabase)
- TypeScript
- JWT + HMAC Authentication
- Swagger Documentation

## Project Structure

```
prisma/              → Prisma schema & migrations
src/
  modules/
    auth/            → JWT authentication (merchant login)
    merchant/        → Merchant registration & management
    payment/         → Payment session processing
    provider/        → Mock payment providers (bKash, Nagad, Card)
    transaction/     → Transaction records
    webhook/         → Webhook notifications
  common/
    guards/          → API Key + HMAC auth guard
    utils/           → HMAC signature utilities
  config/            → Application configuration
  database/          → Prisma service (global)
  main.ts            → App entry point with Swagger setup
API_DOCUMENTATION.md → Full API reference & testing guide
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
```bash
# Create .env file
DATABASE_URL="your_supabase_database_url"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="1d"
```

### 3. Run Prisma migration
```bash
npx prisma migrate dev --name init
```

### 4. Start development server
```bash
npm run start:dev
```

## API Documentation

- **Swagger UI**: http://localhost:3000/docs
- **Full API Reference**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Features

- Merchant registration with API key generation
- HMAC-signed API authentication (anti-tamper, anti-replay)
- JWT-based merchant dashboard authentication
- Payment session management (create, get, cancel)
- Mock payment providers (bKash, Nagad, Card)
- Webhook notifications with retry logic
- Transaction history
- Interactive Swagger documentation

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/login | None | Merchant login (JWT) |
| GET | /api/v1/auth/profile | JWT | Get merchant profile |
| POST | /api/v1/merchant/create | None | Register merchant |
| GET | /api/v1/merchant/:id | None | Get merchant details |
| POST | /api/v1/payments/create | API Key + HMAC | Create payment |
| GET | /api/v1/payments/:id | API Key + HMAC | Get payment session |
| POST | /api/v1/payments/:id/cancel | API Key + HMAC | Cancel payment |
| POST | /api/v1/webhook/test | None | Test webhook endpoint |

## Author

Adnan Hossain — MERN Stack Developer
