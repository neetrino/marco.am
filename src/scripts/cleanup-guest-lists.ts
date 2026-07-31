/**
 * One-off cleanup of empty and/or expired guest wishlists and compare lists.
 * Never touches rows with a non-null userId.
 *
 * Usage:
 *   pnpm run cleanup:guest-lists
 *   pnpm run cleanup:guest-lists:apply
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { previewGuestListCleanup, runGuestListCleanup } from "@/lib/services/guest-list-cleanup.service";

function parseArgs(argv: readonly string[]): { execute: boolean } {
  return { execute: argv.includes("--execute") };
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const { execute } = parseArgs(process.argv.slice(2));
  const options = { emptyMinAgeMs: 0 };

  const preview = await previewGuestListCleanup(options);

  process.stdout.write(
    [
      `Guest list cleanup ${execute ? "apply" : "dry-run"}`,
      `empty guest wishlists: ${preview.emptyWishlists}`,
      `expired guest wishlists: ${preview.expiredWishlists}`,
      `unique wishlists to delete: ${preview.wishlistsToDelete}`,
      `empty guest compare lists: ${preview.emptyCompareLists}`,
      `expired guest compare lists: ${preview.expiredCompareLists}`,
      `unique compare lists to delete: ${preview.compareListsToDelete}`,
    ].join("\n") + "\n",
  );

  if (!execute) {
    return;
  }

  const result = await runGuestListCleanup(options);
  process.stdout.write(
    [
      `wishlists deleted: ${result.wishlistsDeleted}`,
      `compare lists deleted: ${result.compareListsDeleted}`,
    ].join("\n") + "\n",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
