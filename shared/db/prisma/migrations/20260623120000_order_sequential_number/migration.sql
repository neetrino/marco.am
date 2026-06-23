-- Simple sequential order numbers (1, 2, 3, …) for admin and customer-facing display.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- Avoid unique constraint collisions while renumbering existing orders.
UPDATE "orders" SET "number" = 'tmp-' || "id";

WITH numbered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
  FROM "orders"
)
UPDATE "orders" AS o
SET "number" = numbered.seq::text
FROM numbered
WHERE o."id" = numbered."id";

SELECT setval(
  'order_number_seq',
  COALESCE((SELECT MAX("number"::bigint) FROM "orders"), 0),
  true
);
