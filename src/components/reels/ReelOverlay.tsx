export type ReelOverlayProps = {
  title: string;
};

export function ReelOverlay({ title }: ReelOverlayProps) {
  void title;
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.16)_45%,rgba(0,0,0,0.02)_65%)]"
        aria-hidden
      />
    </>
  );
}
