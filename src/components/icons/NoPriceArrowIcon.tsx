/** Figma-style no-price CTA — yellow circle with black up-right arrow. */

const VIEWBOX = 48;
const CIRCLE_FILL = '#ffca03';
const ARROW_FILL = '#383838';

const ARROW_PATH =
  'M17.1868 28.9554C16.7377 29.4045 16.7377 30.1326 17.1868 30.5817C17.6359 31.0308 18.3641 31.0308 18.8132 30.5817L18 29.7686L17.1868 28.9554ZM30.9186 18C30.9186 17.3648 30.4037 16.85 29.7686 16.85L19.4186 16.85C18.7835 16.85 18.2686 17.3648 18.2686 18C18.2686 18.6351 18.7835 19.15 19.4186 19.15L28.6186 19.15L28.6186 28.35C28.6186 28.9851 29.1335 29.5 29.7686 29.5C30.4037 29.5 30.9186 28.9851 30.9186 28.35L30.9186 18ZM18 29.7686L18.8132 30.5817L30.5818 18.8131L29.7686 18L28.9554 17.1868L17.1868 28.9554L18 29.7686Z';

type NoPriceArrowIconProps = {
  readonly className?: string;
};

/**
 * Black up-right arrow only — for yellow circular buttons that already provide the fill.
 */
export function NoPriceArrowGlyph({ className }: NoPriceArrowIconProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d={ARROW_PATH} fill={ARROW_FILL} />
    </svg>
  );
}

/**
 * Arrow-in-yellow-circle glyph for products without a display price.
 */
export function NoPriceArrowIcon({ className }: NoPriceArrowIconProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" fill={CIRCLE_FILL} />
      <path d={ARROW_PATH} fill={ARROW_FILL} />
    </svg>
  );
}
