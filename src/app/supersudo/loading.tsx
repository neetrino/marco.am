export default function AdminLoading() {
  return (
    <div
      className="h-1 w-full shrink-0 animate-pulse bg-[var(--app-text)]/15"
      aria-busy="true"
      aria-label="Loading admin"
    />
  );
}
