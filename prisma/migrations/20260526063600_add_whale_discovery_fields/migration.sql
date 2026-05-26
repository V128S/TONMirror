-- AlterEnum
ALTER TYPE "LeaderSourceType" ADD VALUE 'auto_discovered';

-- AlterTable
ALTER TABLE "LeaderWallet" ADD COLUMN     "discoveryScore" DOUBLE PRECISION,
ADD COLUMN     "lastDiscoveredAt" TIMESTAMP(3),
ADD COLUMN     "tradeCount30d" INTEGER,
ADD COLUMN     "volumeUsd30d" DOUBLE PRECISION;
