/**
 * One-off: replace console.log/info/debug/trace with logger.* and add import.
 * Skips src/lib/utils/logger.ts
 */
import fs from "node:fs";
import path from "node:path";

const srcRoot = path.join(process.cwd(), "src");

function walkTsFiles(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTsFiles(p, acc);
    else if (/\.(ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function hasLoggerImport(content) {
  return /import\s*\{[^}]*\blogger\b[^}]*\}\s*from\s*["']@\/lib\/utils\/logger["']/.test(
    content,
  );
}

function addLoggerImport(content) {
  if (hasLoggerImport(content)) return content;
  const lines = content.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trimStart();
    if (t.startsWith("import ") || t.startsWith("import\t")) lastImport = i;
    else if (t !== "" && !t.startsWith("//") && lastImport >= 0) break;
  }
  const stmt = 'import { logger } from "@/lib/utils/logger";';
  if (lastImport === -1) return `${stmt}\n\n${content}`;
  lines.splice(lastImport + 1, 0, stmt);
  return lines.join("\n");
}

function processFile(filePath) {
  if (filePath.endsWith(`${path.sep}logger.ts`)) return false;
  let s = fs.readFileSync(filePath, "utf8");
  if (!/\bconsole\.(log|info|debug|trace)\(/.test(s)) return false;
  const orig = s;
  s = s.replace(/\bconsole\.log\(/g, "logger.devLog(");
  s = s.replace(/\bconsole\.info\(/g, "logger.devInfo(");
  s = s.replace(/\bconsole\.debug\(/g, "logger.devDebug(");
  s = s.replace(/\bconsole\.trace\(/g, "logger.devLog(");
  if (s === orig) return false;
  if (/\blogger\.(devLog|devInfo|devDebug)\(/.test(s)) {
    s = addLoggerImport(s);
  }
  fs.writeFileSync(filePath, s);
  return true;
}

const files = walkTsFiles(srcRoot);
let n = 0;
for (const f of files) {
  if (processFile(f)) n += 1;
}
console.log(`Updated ${n} files`);
