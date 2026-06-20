/** Formats the "last updated" line for legal pages (client-safe, no server APIs). */
export function formatLegalPageDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
