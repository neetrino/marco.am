const crypto = require("crypto");

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
    headers.forEach((header, index) => {
      record[header] = (values[index] || "").trim();
    });
    return record;
  });
}

function hashText(value, length = 10) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, length);
}

function asciiSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toAsciiSlug(value, fallbackPrefix) {
  const slug = asciiSlug(value);
  return slug || `${fallbackPrefix}-${hashText(value)}`;
}

function filterAttributeKey(label, filterIndex) {
  return asciiSlug(label) || `marco_filter_${filterIndex}`;
}

function buildFilterColumnDefinitions(sampleRow) {
  const defs = [];
  for (const header of Object.keys(sampleRow || {})) {
    const match = /^Filter\s*(\d+)\s*-\s*(.+)$/i.exec(header.trim());
    if (!match) continue;
    const filterIndex = Number.parseInt(match[1], 10);
    if (!Number.isFinite(filterIndex)) continue;
    const attributeLabel = match[2].trim();
    defs.push({
      header,
      filterIndex,
      attributeKey: filterAttributeKey(attributeLabel, filterIndex),
      attributeLabel,
    });
  }
  return defs.sort((a, b) => a.filterIndex - b.filterIndex);
}

function normalizeComparable(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function hasMatchingTranslation(attribute, label) {
  const target = normalizeComparable(label);
  return (attribute.translations || []).some(
    (translation) => normalizeComparable(translation.name) === target,
  );
}

/**
 * Prefer an existing semantic match, with the same-position legacy key winning ties.
 * This keeps old `marco_filter_N` catalogs stable while avoiding a second attribute
 * when an Armenian label already exists under another legacy key.
 */
function chooseExistingFilterAttribute(definition, attributes) {
  const legacyKey = `marco_filter_${definition.filterIndex}`;
  const sortedAttributes = [...attributes].sort((left, right) =>
    `${left.key}:${left.id}`.localeCompare(`${right.key}:${right.id}`),
  );
  return (
    sortedAttributes.find(
      (attribute) =>
        attribute.key === definition.attributeKey &&
        hasMatchingTranslation(attribute, definition.attributeLabel),
    ) ||
    sortedAttributes.find(
      (attribute) =>
        attribute.key === legacyKey && hasMatchingTranslation(attribute, definition.attributeLabel),
    ) ||
    sortedAttributes.find((attribute) =>
      hasMatchingTranslation(attribute, definition.attributeLabel),
    ) ||
    sortedAttributes.find((attribute) => attribute.key === definition.attributeKey) ||
    sortedAttributes.find((attribute) => attribute.key === legacyKey) ||
    null
  );
}

function splitColorValues(value) {
  const seen = new Set();
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeComparable(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function uniqueSelections(selections) {
  const seen = new Set();
  return selections.filter((selection) => {
    if (!selection.attributeId || !selection.valueId) return false;
    const key = `${selection.attributeId}:${selection.valueId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildNewProductAttributeRelations(selections) {
  const selected = uniqueSelections(selections);
  const attributeIds = [...new Set(selected.map((selection) => selection.attributeId))];
  return {
    attributeIds,
    productAttributes:
      attributeIds.length > 0
        ? { create: attributeIds.map((attributeId) => ({ attributeId })) }
        : undefined,
    attributeValues:
      selected.length > 0
        ? {
            create: selected.map((selection) => ({
              attributeId: selection.attributeId,
              attributeValueId: selection.valueId,
            })),
          }
        : undefined,
  };
}

function mergeManagedAttributeIds(existingIds, managedAttributeIds, selectedAttributeIds) {
  const managed = new Set(managedAttributeIds);
  return [
    ...new Set([
      ...existingIds.filter((attributeId) => !managed.has(attributeId)),
      ...selectedAttributeIds,
    ]),
  ];
}

function mergeManagedVariantAttributes(existingAttributes, managedAttributeKeys, selections) {
  const next =
    existingAttributes && typeof existingAttributes === "object" && !Array.isArray(existingAttributes)
      ? { ...existingAttributes }
      : {};

  for (const key of managedAttributeKeys) {
    delete next[key];
  }

  for (const selection of uniqueSelections(selections)) {
    if (!next[selection.attributeKey]) next[selection.attributeKey] = [];
    next[selection.attributeKey].push({
      valueId: selection.valueId,
      value: selection.value,
      attributeKey: selection.attributeKey,
    });
  }

  return Object.keys(next).length > 0 ? next : null;
}

async function syncManagedProductAttributes(
  tx,
  { productId, managedAttributeIds, selections },
) {
  const managedIds = [...new Set(managedAttributeIds.filter(Boolean))];
  const selected = uniqueSelections(selections);
  const selectedAttributeIds = [...new Set(selected.map((selection) => selection.attributeId))];

  if (managedIds.length > 0) {
    await tx.productAttributeValue.deleteMany({
      where: { productId, attributeId: { in: managedIds } },
    });
    await tx.productAttribute.deleteMany({
      where: { productId, attributeId: { in: managedIds } },
    });
  }

  if (selectedAttributeIds.length > 0) {
    await tx.productAttribute.createMany({
      data: selectedAttributeIds.map((attributeId) => ({ productId, attributeId })),
      skipDuplicates: true,
    });
  }

  if (selected.length > 0) {
    await tx.productAttributeValue.createMany({
      data: selected.map((selection) => ({
        productId,
        attributeId: selection.attributeId,
        attributeValueId: selection.valueId,
      })),
      skipDuplicates: true,
    });
  }
}

module.exports = {
  asciiSlug,
  buildNewProductAttributeRelations,
  buildFilterColumnDefinitions,
  chooseExistingFilterAttribute,
  filterAttributeKey,
  hashText,
  mergeManagedAttributeIds,
  mergeManagedVariantAttributes,
  parseCsv,
  splitColorValues,
  syncManagedProductAttributes,
  toAsciiSlug,
  uniqueSelections,
};
