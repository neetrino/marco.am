/**
 * Dashboard utility functions
 */

/** Dashboard money is order/checkout currency (AMD), not USD. */
export function formatCurrency(amount: number, currency: string = 'AMD'): string {
  const code = currency.trim() || 'AMD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

/**
 * Formats date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('hy-AM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

