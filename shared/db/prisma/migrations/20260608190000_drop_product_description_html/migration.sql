-- Step 2: remove legacy HTML column after data migration script has run.
ALTER TABLE "product_translations" DROP COLUMN IF EXISTS "descriptionHtml";
