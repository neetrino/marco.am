"use strict";

const STATUS_ORDER = new Map(
  [
    "product_not_found",
    "attribute_unresolved",
    "value_create",
    "link_create",
    "stale_remove",
    "noop",
  ].map((status, index) => [status, index]),
);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeMatch(value) {
  return normalizeText(value).toLocaleLowerCase();
}

function valueRef(attributeId, value) {
  return `${attributeId}:${normalizeMatch(value)}`;
}

function assertManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) {
    throw new Error("Unsupported or missing manifest schemaVersion (expected 1)");
  }
  if (!Array.isArray(manifest.attributeDefinitions) || !Array.isArray(manifest.entries)) {
    throw new Error("Manifest must contain attributeDefinitions[] and entries[]");
  }
  const definitionIds = new Set();
  for (const definition of manifest.attributeDefinitions) {
    if (!definition || !normalizeText(definition.id) || !normalizeText(definition.label)) {
      throw new Error("Each attribute definition needs a non-empty id and label");
    }
    if (definitionIds.has(definition.id)) {
      throw new Error(`Duplicate attribute definition id: ${definition.id}`);
    }
    definitionIds.add(definition.id);
  }
  const skus = new Set();
  for (const entry of manifest.entries) {
    const sku = normalizeText(entry?.sku);
    if (!sku) throw new Error("Each manifest entry needs a non-empty SKU");
    if (skus.has(sku)) throw new Error(`Duplicate manifest SKU: ${sku}`);
    skus.add(sku);
    if (!Array.isArray(entry.values)) throw new Error(`Manifest entry ${sku} needs values[]`);
    for (const item of entry.values) {
      if (!definitionIds.has(item.definitionId)) {
        throw new Error(`Manifest entry ${sku} uses unknown definition ${item.definitionId}`);
      }
      if (!normalizeText(item.value)) {
        throw new Error(`Manifest entry ${sku} has a blank value for ${item.definitionId}`);
      }
    }
  }
  return manifest;
}

function uniqueCandidates(candidates) {
  return [...new Map(candidates.map((attribute) => [attribute.id, attribute])).values()];
}

function attributeNames(attribute) {
  return (attribute.translations ?? []).map((translation) => normalizeMatch(translation.name));
}

function resolveDefinition(definition, attributes) {
  const exactKey = (key) =>
    uniqueCandidates(attributes.filter((attribute) => attribute.key === key));
  const byLabel = uniqueCandidates(
    attributes.filter((attribute) => attributeNames(attribute).includes(normalizeMatch(definition.label))),
  );
  const priorities = [];

  if (definition.kind === "color") priorities.push(["color_key", exactKey("color")]);
  priorities.push(["translation_label", byLabel]);
  if (normalizeText(definition.semanticKey)) {
    priorities.push(["semantic_key", exactKey(definition.semanticKey)]);
  }
  for (const compatibilityKey of definition.compatibilityKeys ?? []) {
    priorities.push(["compatibility_key", exactKey(compatibilityKey)]);
  }

  let ambiguousResolution = null;
  for (const [method, candidates] of priorities) {
    if (candidates.length === 1) {
      return { definition, attribute: candidates[0], method };
    }
    if (candidates.length > 1 && !ambiguousResolution) {
      ambiguousResolution = {
        definition,
        attribute: null,
        method,
        reason: "ambiguous",
        candidates: candidates.map((attribute) => ({ id: attribute.id, key: attribute.key })),
      };
    }
  }

  if (ambiguousResolution) return ambiguousResolution;

  return {
    definition,
    attribute: null,
    method: null,
    reason: "not_found",
    candidates: [],
  };
}

function buildDefinitionResolutions(definitions, attributes) {
  return new Map(
    definitions.map((definition) => [definition.id, resolveDefinition(definition, attributes)]),
  );
}

function attributeValueLabels(attributeValue) {
  return [
    normalizeMatch(attributeValue.value),
    ...(attributeValue.translations ?? []).map((translation) => normalizeMatch(translation.label)),
  ].filter(Boolean);
}

function resolveAttributeValue(attribute, requestedValue) {
  const normalized = normalizeMatch(requestedValue);
  const candidates = uniqueCandidates(
    (attribute.values ?? []).filter((attributeValue) =>
      attributeValueLabels(attributeValue).includes(normalized),
    ),
  );
  if (candidates.length === 1) return { attributeValue: candidates[0], ambiguous: false };
  if (candidates.length > 1) return { attributeValue: null, ambiguous: true, candidates };
  return { attributeValue: null, ambiguous: false, candidates: [] };
}

function sortStatuses(statuses) {
  return statuses.sort((left, right) => {
    const rank = (STATUS_ORDER.get(left.status) ?? 999) - (STATUS_ORDER.get(right.status) ?? 999);
    if (rank !== 0) return rank;
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
}

function planEntry(entry, product, definitionResolutions) {
  const sku = normalizeText(entry.sku);
  if (!product) {
    return {
      sku,
      productId: null,
      sourceRow: entry.sourceRow,
      statuses: [{ status: "product_not_found" }],
      desired: [],
      staleLinkIds: [],
    };
  }

  const statuses = [];
  const desiredByAttribute = new Map();
  const valuesByDefinition = new Map();
  for (const item of entry.values) {
    const values = valuesByDefinition.get(item.definitionId) ?? [];
    values.push(item);
    valuesByDefinition.set(item.definitionId, values);
  }
  const managedAttributeIds = new Set();
  const blockedAttributeIds = new Set();

  for (const [definitionId, resolution] of definitionResolutions) {
    const sourceValues = valuesByDefinition.get(definitionId) ?? [];
    if (!resolution.attribute) {
      for (const sourceValue of sourceValues) {
        statuses.push({
          status: "attribute_unresolved",
          definitionId,
          label: resolution.definition.label,
          value: sourceValue.value,
          reason: resolution.reason,
          candidates: resolution.candidates,
        });
      }
      continue;
    }

    const attribute = resolution.attribute;
    managedAttributeIds.add(attribute.id);
    for (const sourceValue of sourceValues) {
      const valueResolution = resolveAttributeValue(attribute, sourceValue.value);
      if (valueResolution.ambiguous) {
        blockedAttributeIds.add(attribute.id);
        statuses.push({
          status: "attribute_unresolved",
          definitionId,
          label: resolution.definition.label,
          value: sourceValue.value,
          reason: "ambiguous_value",
          candidates: valueResolution.candidates.map((value) => ({
            id: value.id,
            value: value.value,
          })),
        });
        continue;
      }

      const desired = desiredByAttribute.get(attribute.id) ?? [];
      const item = {
        definitionId,
        attributeId: attribute.id,
        attributeKey: attribute.key,
        attributeLabel: resolution.definition.label,
        resolutionMethod: resolution.method,
        value: normalizeText(sourceValue.value),
        valueRef: valueRef(attribute.id, sourceValue.value),
        attributeValueId: valueResolution.attributeValue?.id ?? null,
        sourceCell: sourceValue.sourceCell ?? null,
      };
      if (!desired.some((existing) => existing.valueRef === item.valueRef)) desired.push(item);
      desiredByAttribute.set(attribute.id, desired);
      if (!item.attributeValueId) {
        statuses.push({
          status: "value_create",
          definitionId,
          attributeId: attribute.id,
          attributeKey: attribute.key,
          value: item.value,
        });
      }
    }
  }

  const productAttributeIds = new Set(
    (product.productAttributes ?? []).map((row) => row.attributeId),
  );
  const currentLinks = product.attributeValues ?? [];
  const currentPairs = new Set(
    currentLinks.map((row) => `${row.attributeId}:${row.attributeValueId}`),
  );
  const desired = [...desiredByAttribute.values()].flat();

  for (const attributeId of [...desiredByAttribute.keys()].sort()) {
    if (!productAttributeIds.has(attributeId)) {
      statuses.push({ status: "link_create", linkType: "product_attribute", attributeId });
    }
  }
  for (const item of desired) {
    if (!item.attributeValueId || !currentPairs.has(`${item.attributeId}:${item.attributeValueId}`)) {
      statuses.push({
        status: "link_create",
        linkType: "product_attribute_value",
        attributeId: item.attributeId,
        attributeValueId: item.attributeValueId,
        value: item.value,
      });
    }
  }

  const desiredValueIdsByAttribute = new Map();
  for (const item of desired) {
    if (!item.attributeValueId) continue;
    const ids = desiredValueIdsByAttribute.get(item.attributeId) ?? new Set();
    ids.add(item.attributeValueId);
    desiredValueIdsByAttribute.set(item.attributeId, ids);
  }

  const staleLinkIds = [];
  for (const link of currentLinks) {
    if (!managedAttributeIds.has(link.attributeId)) continue;
    if (blockedAttributeIds.has(link.attributeId)) continue;
    const desiredIds = desiredValueIdsByAttribute.get(link.attributeId) ?? new Set();
    if (!desiredIds.has(link.attributeValueId)) {
      staleLinkIds.push(link.id);
      statuses.push({
        status: "stale_remove",
        linkType: "product_attribute_value",
        linkId: link.id,
        attributeId: link.attributeId,
        attributeValueId: link.attributeValueId,
      });
    }
  }

  if (statuses.length === 0) statuses.push({ status: "noop" });
  return {
    sku,
    productId: product.id,
    sourceRow: entry.sourceRow,
    statuses: sortStatuses(statuses),
    desired,
    staleLinkIds: staleLinkIds.sort(),
  };
}

function planReconciliation(manifest, products, attributes) {
  assertManifest(manifest);
  const productsBySku = new Map(products.map((product) => [normalizeText(product.sku), product]));
  const resolutions = buildDefinitionResolutions(manifest.attributeDefinitions, attributes);
  const entries = [...manifest.entries].sort((a, b) =>
    normalizeText(a.sku).localeCompare(normalizeText(b.sku)),
  );
  return entries.map((entry) => planEntry(entry, productsBySku.get(normalizeText(entry.sku)), resolutions));
}

function summarizePlans(plans) {
  const counts = {
    skus: plans.length,
    product_not_found: 0,
    attribute_unresolved: 0,
    value_create: 0,
    link_create: 0,
    stale_remove: 0,
    noop: 0,
  };
  for (const plan of plans) {
    for (const item of plan.statuses) {
      if (Object.hasOwn(counts, item.status)) counts[item.status] += 1;
    }
  }
  return counts;
}

module.exports = {
  assertManifest,
  buildDefinitionResolutions,
  normalizeMatch,
  normalizeText,
  planEntry,
  planReconciliation,
  resolveAttributeValue,
  resolveDefinition,
  summarizePlans,
  valueRef,
};
