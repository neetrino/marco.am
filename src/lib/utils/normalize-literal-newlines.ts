/**
 * Legacy exports often use escaped line breaks as text: backslash+n, or `/n`.
 * Converts those to real newlines before HTML/text cleanup.
 */
export function normalizeLiteralNewlinesToLineBreaks(input: string): string {
  if (!input) return input;
  return input
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\/n/g, '\n');
}
