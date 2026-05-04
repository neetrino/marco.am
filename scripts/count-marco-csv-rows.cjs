/** One-off: count parsed rows in a Marco CSV (same parser as import). */
const fs = require("fs");
const path = require("path");

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] || "").trim();
    });
    return record;
  });
}

function buildFilterColumnDefinitions(sampleRow) {
  const defs = [];
  for (const header of Object.keys(sampleRow || {})) {
    const m = /^Filter\s*(\d+)\s*-\s*(.+)$/i.exec(header.trim());
    if (!m) continue;
    const filterIndex = Number.parseInt(m[1], 10);
    if (!Number.isFinite(filterIndex)) continue;
    defs.push({
      header,
      filterIndex,
      attributeKey: `marco_filter_${filterIndex}`,
      attributeLabel: m[2].trim(),
    });
  }
  return defs.sort((a, b) => a.filterIndex - b.filterIndex);
}

const p =
  process.argv[2] ||
  "C:\\Users\\ROG\\Downloads\\Telegram Desktop\\Marco - Sheet1.csv";
const content = fs.readFileSync(p, "utf8");
const rows = parseCsv(content);
const filterDefs = rows.length > 0 ? buildFilterColumnDefinitions(rows[0]) : [];
console.log(JSON.stringify({ path: p, productRows: rows.length, filterColumns: filterDefs.length, filters: filterDefs.map((d) => ({ key: d.attributeKey, label: d.attributeLabel })) }, null, 2));
