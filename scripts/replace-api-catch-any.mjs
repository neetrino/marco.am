/**
 * One-off: replace common catch (error: any) + NextResponse.json error blocks with toApiErrorResponse.
 * Run: node scripts/replace-api-catch-any.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "app", "api");

const blockPattern =
  /catch \(error: any\) \{[\s\S]*?return NextResponse\.json\(\s*\{\s*type: error\.type \|\| "https:\/\/api\.shop\.am\/problems\/internal-error",\s*title: error\.title \|\| "Internal Server Error",\s*status: error\.status \|\| 500,\s*detail: error\.detail \|\| error\.message \|\| "An error occurred",\s*instance: ([^,]+),\s*\},\s*\{\s*status: error\.status \|\| 500\s*\}\s*\);\s*\}/g;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (name.endsWith("route.ts")) files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("catch (error: any)")) continue;
  const orig = s;
  if (!s.includes("toApiErrorResponse")) {
    if (s.includes('from "next/server"')) {
      s = s.replace(
        /import \{ NextRequest, NextResponse \} from "next\/server";/,
        `import { NextRequest, NextResponse } from "next/server";\nimport { toApiErrorResponse } from "@/lib/api/next-route-error";`
      );
      if (!s.includes("toApiErrorResponse")) {
        s = s.replace(
          /import \{ NextResponse \} from "next\/server";/,
          `import { NextResponse } from "next/server";\nimport { toApiErrorResponse } from "@/lib/api/next-route-error";`
        );
      }
    }
  }
  s = s.replace(blockPattern, (match, instanceExpr) => {
    const label = match.match(/console\.error\([^)]+\)/)?.[0] ?? "console.error(error)";
    return `catch (error: unknown) {\n    ${label};\n    return toApiErrorResponse(error, ${instanceExpr.trim()});\n  }`;
  });
  if (s !== orig) {
    fs.writeFileSync(file, s);
    changed++;
    console.log("updated", path.relative(path.join(__dirname, ".."), file));
  }
}
console.log("files changed:", changed);
