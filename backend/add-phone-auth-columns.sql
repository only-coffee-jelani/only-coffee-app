ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "marketingOptIn" boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "verificationCode" varchar(6),
ADD COLUMN IF NOT EXISTS "verificationCodeExpiry" timestamptz;
