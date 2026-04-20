export type ProductsFilterCheckboxVariant = 'default' | 'checkmark';

interface ProductsFilterCheckboxVisualProps {
  readonly checked: boolean;
  /**
   * `checkmark` — при выборе белый квадрат с тёмной галочкой (категории).
   * `default` — заливка + белая галочка (бренды и др.).
   */
  readonly variant?: ProductsFilterCheckboxVariant;
}

/** Figma MARCO 448:2681 — filter row checkbox (20px, #cad5e2 border) */
export function ProductsFilterCheckboxVisual({
  checked,
  variant = 'default',
}: ProductsFilterCheckboxVisualProps) {
  const isCheckmark = variant === 'checkmark';

  return (
    <span
      className={`flex size-5 shrink-0 items-center justify-center rounded border-2 border-solid transition-colors duration-200 ease-out ${
        isCheckmark
          ? checked
            ? 'border-marco-black bg-white'
            : 'border-[#cad5e2] bg-white'
          : checked
            ? 'border-marco-black bg-marco-black'
            : 'border-[#cad5e2] bg-white'
      }`}
      aria-hidden
    >
      {checked ? (
        <svg
          width="12"
          height="10"
          viewBox="0 0 12 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isCheckmark ? 'text-marco-black' : 'text-white'}
        >
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
