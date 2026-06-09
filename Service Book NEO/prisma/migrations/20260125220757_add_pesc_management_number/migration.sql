/*
  Warnings:

  - A unique constraint covering the columns `[managementNumber]` on the table `Request` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN "billingAddress" TEXT;
ALTER TABLE "Request" ADD COLUMN "billingFax" TEXT;
ALTER TABLE "Request" ADD COLUMN "billingName" TEXT;
ALTER TABLE "Request" ADD COLUMN "billingTel" TEXT;
ALTER TABLE "Request" ADD COLUMN "billingZip" TEXT;
ALTER TABLE "Request" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Request" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Request" ADD COLUMN "customerPlusCode" TEXT;
ALTER TABLE "Request" ADD COLUMN "customerTel1" TEXT;
ALTER TABLE "Request" ADD COLUMN "customerTel2" TEXT;
ALTER TABLE "Request" ADD COLUMN "customerZip" TEXT;
ALTER TABLE "Request" ADD COLUMN "deviceManufacturer" TEXT;
ALTER TABLE "Request" ADD COLUMN "managementNumber" TEXT;
ALTER TABLE "Request" ADD COLUMN "pescManagementNumber" TEXT;
ALTER TABLE "Request" ADD COLUMN "receivedAt" DATETIME;

-- CreateTable
CREATE TABLE "BillingItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "BillingItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_managementNumber_key" ON "Request"("managementNumber");
