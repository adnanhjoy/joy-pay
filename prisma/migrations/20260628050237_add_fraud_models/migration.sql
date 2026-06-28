-- CreateEnum
CREATE TYPE "FraudAction" AS ENUM ('ALLOW', 'FLAG', 'BLOCK');

-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "decision" "FraudAction" NOT NULL,
    "checks" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "action" "FraudAction" NOT NULL DEFAULT 'FLAG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fraud_checks_transactionId_key" ON "fraud_checks"("transactionId");

-- CreateIndex
CREATE INDEX "fraud_checks_transactionId_idx" ON "fraud_checks"("transactionId");

-- CreateIndex
CREATE INDEX "fraud_rules_merchantId_idx" ON "fraud_rules"("merchantId");

-- AddForeignKey
ALTER TABLE "fraud_checks" ADD CONSTRAINT "fraud_checks_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_rules" ADD CONSTRAINT "fraud_rules_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
