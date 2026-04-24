'use client';

interface SpecificationValueDisplayProps {
  value: string;
}

const COMMA_LIST_SPLIT = /,\s*/;

export function splitSpecificationValueParts(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return [];
  }
  const parts = trimmed.split(COMMA_LIST_SPLIT).map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(part);
  }
  return unique;
}

export function SpecificationValueDisplay({ value }: SpecificationValueDisplayProps) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return <span className="text-gray-400">—</span>;
  }

  const parts = splitSpecificationValueParts(trimmed);
  if (parts.length <= 1) {
    return <span className="break-words leading-relaxed">{trimmed}</span>;
  }

  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" role="list">
      {parts.map((part) => (
        <li key={part}>
          <span className="inline-flex max-w-full items-center rounded-lg border border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100/80 px-2.5 py-1 text-xs font-medium leading-snug text-marco-black shadow-sm md:px-3 md:py-1.5 md:text-sm">
            <span className="break-words">{part}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
