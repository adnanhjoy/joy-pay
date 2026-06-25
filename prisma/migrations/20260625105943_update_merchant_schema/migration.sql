/*
  Warnings:

  - Added the required column `businessAddress` to the `merchants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessCategory` to the `merchants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessName` to the `merchants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessType` to the `merchants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `merchants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradeLicense` to the `merchants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "businessAddress" TEXT NOT NULL,
ADD COLUMN     "businessCategory" TEXT NOT NULL,
ADD COLUMN     "businessName" TEXT NOT NULL,
ADD COLUMN     "businessRegNo" TEXT,
ADD COLUMN     "businessType" TEXT NOT NULL,
ADD COLUMN     "businessWebsite" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isKycVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "routingNumber" TEXT,
ADD COLUMN     "status" "MerchantStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tinNo" TEXT,
ADD COLUMN     "tradeLicense" TEXT NOT NULL,
ADD COLUMN     "webhookSecret" TEXT;
