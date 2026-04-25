ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "users_phoneNumber_key" ON "users"("phoneNumber");
