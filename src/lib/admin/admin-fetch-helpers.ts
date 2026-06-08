/** Skips loading spinners when stale rows can be shown during background refresh. */
export function beginAdminDataFetch(
  hasDisplayableData: boolean,
  setLoading: (value: boolean) => void,
): void {
  if (!hasDisplayableData) {
    setLoading(true);
  }
}
