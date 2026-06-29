-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderType" ADD VALUE 'STOP_LIMIT';
ALTER TYPE "OrderType" ADD VALUE 'STOP_MARKET';

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "makerFee" DECIMAL(10,6) NOT NULL DEFAULT 0.0010,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvesAt" TIMESTAMP(3),
ADD COLUMN     "takerFee" DECIMAL(10,6) NOT NULL DEFAULT 0.0020;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stopPrice" DECIMAL(30,10);

-- AlterTable
ALTER TABLE "Outcome" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isWinner" BOOLEAN,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "makerFee" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "takerFee" DECIMAL(30,10) NOT NULL DEFAULT 0;
