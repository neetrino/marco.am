import { PrismaClient } from './shared/db/generated/prisma-client/index.js';

const prisma = new PrismaClient();

try {
  await prisma.$queryRawUnsafe('SELECT 1 as ok');
  console.log('DB_OK');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log('DB_FAIL');
  console.log(message.split('\n').slice(0, 5).join(' | '));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
