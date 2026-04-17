/** Figma MARCO 448:2681 — filter row checkbox (20px, #cad5e2 border) */
export function ProductsFilterCheckboxVisual({ checked }: { readonly checked: boolean }) {
  return (
    <span
      className={`flex size-5 shrink-0 items-center justify-center rounded border-2 border-solid bg-white ${
        checked ? 'border-marco-black bg-marco-black' : 'border-[#cad5e2]'
      }`}
      aria-hidden
    >
      {checked ? (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
