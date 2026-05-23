'use client';

import {
  splitSpecificationFootnote,
  splitSpecificationValueParts,
} from './product-specifications-value';

interface SpecificationValueDisplayProps {
  value: string;
}

function SpecificationMainValue({ main }: { main: string }) {
  const parts = splitSpecificationValueParts(main);
  if (parts.length <= 1) {
    return <span className="break-words leading-relaxed">{main}</span>;
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

export function SpecificationValueDisplay({ value }: SpecificationValueDisplayProps) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return <span className="text-gray-400">—</span>;
  }

  const { main, footnote } = splitSpecificationFootnote(trimmed);
  if (!footnote) {
    return <SpecificationMainValue main={main} />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <SpecificationMainValue main={main} />
      <span className="block break-words text-xs font-normal leading-relaxed text-gray-500 md:text-sm">
        {footnote}
      </span>
    </div>
  );
}
