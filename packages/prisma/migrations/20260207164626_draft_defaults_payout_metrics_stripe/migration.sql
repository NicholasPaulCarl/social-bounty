-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "bounties" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "payoutMetrics" JSONB,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "shortDescription" SET DEFAULT '',
ALTER COLUMN "fullInstructions" SET DEFAULT '',
ALTER COLUMN "category" SET DEFAULT '',
ALTER COLUMN "rewardType" SET DEFAULT 'CASH',
ALTER COLUMN "eligibilityRules" SET DEFAULT '',
ALTER COLUMN "proofRequirements" SET DEFAULT '';

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "reportedMetrics" JSONB,
ADD COLUMN     "verificationDeadline" TIMESTAMP(3);
