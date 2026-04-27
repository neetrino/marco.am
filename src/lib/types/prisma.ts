import type { PrismaClient } from '@white-shop/db/prisma';

/**
 * Client passed to interactive Prisma `$transaction` callbacks.
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
