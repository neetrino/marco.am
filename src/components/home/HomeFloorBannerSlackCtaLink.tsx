import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

import {
  HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
  HOME_BANNERS_CTA_PADDING_LEFT_PX,
  HOME_BANNERS_CTA_SLACK_HOVER_END_INSET_PX,
  HOME_BANNERS_CTA_SLACK_LABEL_SHIFT_ON_HOVER_PX,
  HOME_BANNERS_CTA_SLACK_MOTION_DURATION_MS,
  HOME_BANNERS_CTA_SLACK_MOTION_EASING_CSS,
  HOME_BANNERS_CTA_SLACK_TRAVEL_MICRO_PX,
} from './home-banners-cta.constants';

function slackBleedStartFromStyle(linkStyle?: CSSProperties): string {
  const pl = linkStyle?.paddingLeft;
  if (typeof pl === 'number' && Number.isFinite(pl)) {
    return `${pl}px`;
  }
  if (typeof pl === 'string' && pl.trim() !== '') {
    return pl;
  }
  return `${HOME_BANNERS_CTA_PADDING_LEFT_PX}px`;
}

export type HomeFloorBannerSlackCtaLinkProps = {
  href: string;
  ariaLabel: string;
  className: string;
  style?: CSSProperties;
  /** Expanding fill behind the label (e.g. `bg-marco-black`). */
  trailClassName: string;
  /** Applied to the label wrapper (e.g. `transition-colors group-hover:text-white`). */
  labelWrapperClassName: string;
  label: ReactNode;
  /** Inner pill (circle) around the arrow — sizing, colors, per-locale nudges. */
  chipInnerClassName: string;
  chipInnerStyle?: CSSProperties;
  chipChildren: ReactNode;
  /**
   * Distance from the link’s inline-start edge where the chip should stop (CSS length).
   * Sets `--slack-stop-pad` unless `slackStopPadClassName` is set.
   */
  slackStopPad?: string;
  /**
   * When set, merged on the link and used for `--slack-stop-pad` (e.g. responsive
   * `max-lg:[--slack-stop-pad:34px] lg:[--slack-stop-pad:26px]`). Overrides `slackStopPad` inline.
   */
  slackStopPadClassName?: string;
  /**
   * When set, positions the slack chip slightly inward from the pill’s inline-end at rest only
   * (`inset-inline-end`, px). Hover travel is unchanged. Use for one banner variant (e.g. gradient).
   */
  slackChipRestInsetInlineEndPx?: number;
};

/**
 * Floor-banner CTA: on hover/focus, the circular “slack” chip moves toward the inline-start
 * edge while a trail (the chip’s resting fill) wipes the pill; the chip itself should take the
 * pill’s surface color so chip and body effectively swap fills (see consumers’ `chipInnerClassName`).
 */
export function HomeFloorBannerSlackCtaLink({
  href,
  ariaLabel,
  className,
  style,
  trailClassName,
  labelWrapperClassName,
  label,
  chipInnerClassName,
  chipInnerStyle,
  chipChildren,
  slackStopPad = `${HOME_BANNERS_CTA_SLACK_HOVER_END_INSET_PX}px`,
  slackStopPadClassName,
  slackChipRestInsetInlineEndPx,
}: HomeFloorBannerSlackCtaLinkProps) {
  const trackPadEnd = HOME_BANNERS_CTA_ICON_CIRCLE_PX + HOME_BANNERS_CTA_LABEL_ICON_GAP_PX;

  const mergedStyle: CSSProperties = {
    ...(style ?? {}),
    ['--slack-dur' as string]: `${HOME_BANNERS_CTA_SLACK_MOTION_DURATION_MS}ms`,
    ['--slack-ease' as string]: HOME_BANNERS_CTA_SLACK_MOTION_EASING_CSS,
    /** Matches `paddingInlineEnd` on the track row — `100cqw` excludes it, so subtract in translate. */
    ['--slack-track-pe' as string]: `${trackPadEnd}px`,
    /** Pulls travel into the link’s padded cap (track lives in the content box). */
    ['--slack-bleed-start' as string]: slackBleedStartFromStyle(style),
    ['--slack-travel-micro' as string]: `${HOME_BANNERS_CTA_SLACK_TRAVEL_MICRO_PX}px`,
    ['--slack-label-shift' as string]: `${HOME_BANNERS_CTA_SLACK_LABEL_SHIFT_ON_HOVER_PX}px`,
    ...(slackStopPadClassName ? {} : { ['--slack-stop-pad' as string]: slackStopPad }),
  };

  const motionTransform =
    'transform-gpu transition-transform [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none';

  const motionTrail =
    `pointer-events-none absolute inset-0 z-[1] origin-right scale-x-0 ${motionTransform} group-hover:scale-x-100 group-focus-visible:scale-x-100`;

  /**
   * Rest: chip above label so the slack is never painted under glyphs; hover/focus: label above
   * chip so copy stays legible while the chip crosses.
   */
  const motionChipOuter =
    'absolute end-0 top-1/2 z-[4] flex -translate-y-1/2 group-hover:z-[3] group-focus-visible:z-[3]';
  const motionChipInner = `${motionTransform} group-hover:translate-x-[calc(-100cqw+100%+var(--slack-stop-pad)-var(--slack-track-pe)-var(--slack-bleed-start)-var(--slack-travel-micro))] group-focus-visible:translate-x-[calc(-100cqw+100%+var(--slack-stop-pad)-var(--slack-track-pe)-var(--slack-bleed-start)-var(--slack-travel-micro))]`;

  const labelMotionShift =
    'inline-block min-w-0 max-w-full transform-gpu transition-transform [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none group-hover:translate-x-[var(--slack-label-shift)] group-focus-visible:translate-x-[var(--slack-label-shift)] motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0';

  const chipRestInsetStyle: CSSProperties | undefined =
    slackChipRestInsetInlineEndPx != null && Number.isFinite(slackChipRestInsetInlineEndPx)
      ? { insetInlineEnd: slackChipRestInsetInlineEndPx }
      : undefined;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`group relative isolate flex w-full max-w-full shrink-0 items-stretch overflow-hidden ${slackStopPadClassName ?? ''} ${className}`}
      style={mergedStyle}
    >
      <span aria-hidden className={`${motionTrail} ${trailClassName}`} />
      <div
        className="relative z-[2] flex min-h-0 min-w-0 flex-1 items-center [container-type:inline-size]"
        style={{ paddingInlineEnd: trackPadEnd }}
      >
        <span
          className={`relative z-[2] min-w-0 shrink group-hover:z-[20] group-focus-visible:z-[20] ${labelWrapperClassName}`}
        >
          <span className={labelMotionShift}>{label}</span>
        </span>
        <span className={motionChipOuter} style={chipRestInsetStyle} aria-hidden>
          <span className={motionChipInner}>
            <span className={chipInnerClassName} style={chipInnerStyle}>
              {chipChildren}
            </span>
          </span>
        </span>
      </div>
    </Link>
  );
}
