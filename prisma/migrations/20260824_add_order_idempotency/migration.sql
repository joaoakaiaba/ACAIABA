-- Add idempotency key to guarantee checkout cannot create duplicate orders.
-- The key is unique per order so a repeated checkout (same key) returns the same
-- order instead of creating a duplicate.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
