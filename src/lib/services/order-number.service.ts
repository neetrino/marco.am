import type { Prisma } from "@white-shop/db/prisma";

type NextOrderNumberRow = {
  nextval: bigint;
};

/**
 * Allocates the next sequential order number inside an existing transaction.
 */
export async function allocateOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const rows = await tx.$queryRaw<NextOrderNumberRow[]>`
    SELECT nextval('order_number_seq') AS nextval
  `;
  const nextval = rows[0]?.nextval;
  if (nextval === undefined) {
    throw new Error("Failed to allocate order number");
  }
  return nextval.toString();
}
