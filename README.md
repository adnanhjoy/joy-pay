# 💳 Joy Pay Backend API

Joy Pay is a backend system for digital wallet and payment management.  
It is built using NestJS, Prisma ORM, PostgreSQL (Supabase), and TypeScript.

---

## 🚀 Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL (Supabase)
- TypeScript
- Node.js

---

## 📁 Project Structure

prisma/        → Prisma schema & migrations  
src/           → Application source code  
  modules/     → Feature modules (user, wallet, transaction)  
  common/      → Shared utilities  
  config/      → Configuration files  
  main.ts      → App entry point  

---

## ⚙️ Setup Instructions

### 1. Install dependencies
npm install

---

### 2. Setup environment variables

Create a `.env` file:

DATABASE_URL="your_supabase_database_url"

---

### 3. Run Prisma migration
npx prisma migrate dev --name init

---

### 4. Start development server
npm run start:dev

---

## 📌 Features

- User management system
- Wallet system
- Transaction system
- Balance tracking
- Payment history

---

## 👨‍💻 Author

Adnan Hossain
MERN Stack Developer