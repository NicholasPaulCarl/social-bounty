-- AlterEnum
ALTER TYPE "OrgStatus" ADD VALUE 'INACTIVE';

-- AlterTable
ALTER TABLE "bounties" ADD COLUMN     "statusHistory" JSONB;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "reviewHistory" JSONB;

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'NOT_PAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payouts_submissionId_key" ON "payouts"("submissionId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
