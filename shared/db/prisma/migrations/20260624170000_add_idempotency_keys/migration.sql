-- Idempotency keys for safely retried POSTs (e.g. order checkout).
-- Additive: no changes to existing tables.

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "userId" TEXT,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "responseStatus" INTEGER,
  "responseBody" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_key_scope_key"
ON "idempotency_keys"("key", "scope");

CREATE INDEX IF NOT EXISTS "idempotency_keys_createdAt_idx"
ON "idempotency_keys"("createdAt");
