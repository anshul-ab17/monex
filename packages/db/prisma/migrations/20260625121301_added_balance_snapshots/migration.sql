/*
  Warnings:

  - You are about to drop the column `referenceId` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `referenceType` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `makerOrderId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `takerOrderId` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `eventType` to the `EventStore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journalId` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EventStore_subject_idx";

-- DropIndex
DROP INDEX "LedgerEntry_referenceType_referenceId_idx";

-- AlterTable
ALTER TABLE "EventStore" ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "referenceId",
DROP COLUMN "referenceType",
ADD COLUMN     "journalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "makerOrderId",
DROP COLUMN "takerOrderId";

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "available" DECIMAL(30,10) NOT NULL,
    "locked" DECIMAL(30,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerJournal" (
    "id" TEXT NOT NULL,
    "referenceType" "LedgerReferenceType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerJournal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceSnapshot_userId_assetId_idx" ON "BalanceSnapshot"("userId", "assetId");

-- CreateIndex
CREATE INDEX "LedgerJournal_referenceType_referenceId_idx" ON "LedgerJournal"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_journalId_idx" ON "LedgerEntry"("journalId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "LedgerJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
