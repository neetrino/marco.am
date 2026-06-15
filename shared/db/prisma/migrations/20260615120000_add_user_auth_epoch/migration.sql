-- Invalidate sessions on logout / credential or role changes without breaking existing tokens (default 0).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authEpoch" INTEGER NOT NULL DEFAULT 0;
