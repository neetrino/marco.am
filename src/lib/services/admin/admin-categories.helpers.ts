import { toSlug } from "@/lib/utils/slug";

const FALLBACK_CATEGORY_SLUG = "category";

const TRANSLITERATION_MAP: Record<string, string> = {
  "ա": "a",
  "բ": "b",
  "գ": "g",
  "դ": "d",
  "ե": "e",
  "զ": "z",
  "է": "e",
  "ը": "y",
  "թ": "t",
  "ժ": "zh",
  "ի": "i",
  "լ": "l",
  "խ": "kh",
  "ծ": "ts",
  "կ": "k",
  "հ": "h",
  "ձ": "dz",
  "ղ": "gh",
  "ճ": "ch",
  "մ": "m",
  "յ": "y",
  "ն": "n",
  "շ": "sh",
  "ո": "o",
  "չ": "ch",
  "պ": "p",
  "ջ": "j",
  "ռ": "r",
  "ս": "s",
  "վ": "v",
  "տ": "t",
  "ր": "r",
  "ց": "ts",
  "ւ": "v",
  "փ": "p",
  "ք": "q",
  "օ": "o",
  "ֆ": "f",
  "և": "ev",
  "ё": "yo",
  "й": "y",
  "ц": "ts",
  "у": "u",
  "к": "k",
  "е": "e",
  "н": "n",
  "г": "g",
  "ш": "sh",
  "щ": "sh",
  "з": "z",
  "х": "h",
  "ъ": "",
  "ф": "f",
  "ы": "y",
  "в": "v",
  "а": "a",
  "п": "p",
  "р": "r",
  "о": "o",
  "л": "l",
  "д": "d",
  "ж": "zh",
  "э": "e",
  "я": "ya",
  "ч": "ch",
  "с": "s",
  "м": "m",
  "и": "i",
  "т": "t",
  "ь": "",
  "б": "b",
  "ю": "yu",
};

export function buildBaseCategorySlug(title: string): string {
  let transliterated = "";
  const normalizedInput = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const char of normalizedInput) {
    transliterated += TRANSLITERATION_MAP[char] ?? char;
  }

  const slug = toSlug(transliterated);
  return slug.length > 0 ? slug : FALLBACK_CATEGORY_SLUG;
}

export function collectDescendantIds(rootCategoryId: string, childMap: Map<string, string[]>): string[] {
  const queue = [rootCategoryId];
  const descendants: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    descendants.push(currentId);
    const children = childMap.get(currentId) ?? [];
    queue.push(...children);
  }

  return descendants;
}
