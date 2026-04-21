export type ReelOverlayProps = {
  title: string;
};

export function ReelOverlay({ title }: ReelOverlayProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-10 md:px-5 md:pb-5">
        <h2 className="max-w-[80%] text-base font-bold leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] md:text-lg">
          {title}
        </h2>
      </div>
    </>
  );
}
