-- CreateEnum
CREATE TYPE "SocialChannel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK');

-- CreateEnum
CREATE TYPE "PostVisibilityRule" AS ENUM ('MUST_NOT_REMOVE', 'MINIMUM_DURATION');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('HOURS', 'DAYS', 'WEEKS');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ZAR', 'USD', 'GBP', 'EUR');

-- AlterTable
ALTER TABLE "bounties" ADD COLUMN     "aiContentPermitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "channels" JSONB,
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ZAR',
ADD COLUMN     "engagementRequirements" JSONB,
ADD COLUMN     "postMinDurationUnit" "DurationUnit",
ADD COLUMN     "postMinDurationValue" INTEGER,
ADD COLUMN     "postVisibilityRule" "PostVisibilityRule",
ADD COLUMN     "structuredEligibility" JSONB,
ADD COLUMN     "visibilityAcknowledged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bounty_rewards" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "monetaryValue" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bounty_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bounty_rewards_bountyId_idx" ON "bounty_rewards"("bountyId");

-- AddForeignKey
ALTER TABLE "bounty_rewards" ADD CONSTRAINT "bounty_rewards_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
