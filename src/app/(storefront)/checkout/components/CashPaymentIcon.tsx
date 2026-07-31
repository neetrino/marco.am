'use client';

interface CashPaymentIconProps {
  className?: string;
}

/** Stylized banknote for cash payment option (decorative). */
export function CashPaymentIcon({ className = 'h-9 w-9 text-emerald-600' }: CashPaymentIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2.5" y="6" width="19" height="12" rx="2" fill="currentColor" opacity={0.15} />
      <rect x="3" y="6.5" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" opacity={0.35} />
      <path
        d="M6 9.5h2M6 14.5h2M16 9.5h2M16 14.5h2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  );
}
