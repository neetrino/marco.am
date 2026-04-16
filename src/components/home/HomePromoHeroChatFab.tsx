'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_CHAT_FAB_ICON_FILL,
  HERO_CHAT_FAB_MESSAGE_SOLID_PATH_D,
  HERO_CHAT_PILL_BORDER_RADIUS_PX,
  HERO_CHAT_PILL_BOX_SHADOW,
  HERO_CHAT_PILL_MAX_WIDTH_PX,
  HERO_CHAT_PILL_MIN_HEIGHT_PX,
  HERO_CHAT_PILL_PADDING_BLOCK_PX,
  HERO_CHAT_PILL_PADDING_INLINE_PX,
} from '../hero.constants';

const HERO_CHAT_CLUSTER_LINK_CLASSNAME =
  'inline-flex max-w-full flex-row items-center gap-2.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black/40 sm:gap-3';

const HERO_CHAT_FAB_CIRCLE_CLASSNAME =
  'flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_28px_rgba(0,0,0,0.14)] transition hover:bg-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]';

const HERO_CHAT_FAB_SIZE_CLASSNAME = 'size-[48px] md:size-[64px]';

const HERO_CHAT_FAB_ICON_FRAME_CLASSNAME = 'size-[24px] md:size-[32px] shrink-0';

const HERO_CHAT_PILL_TEXT_CLASSNAME =
  'text-center text-xs font-bold leading-4 text-white sm:leading-5 whitespace-normal sm:whitespace-nowrap';

/**
 * Pill background matches `HERO_PROMO_STACK_LAYER_BLUE` (Figma primary); hover from Figma node name.
 */
const HERO_CHAT_PILL_SURFACE_CLASSNAME =
  'bg-[#2f4b5d] transition-colors hover:bg-red-700';

/**
 * Figma MARCO — 101:4068 pill + 101:4070/4071 chat FAB; single control linking to contact.
 */
export function HomePromoHeroChatFab() {
  const { t } = useTranslation();

  return (
    <Link href="/contact" className={HERO_CHAT_CLUSTER_LINK_CLASSNAME}>
      <span
        className={`inline-flex min-w-0 items-center justify-center ${HERO_CHAT_PILL_SURFACE_CLASSNAME}`}
        style={{
          paddingLeft: HERO_CHAT_PILL_PADDING_INLINE_PX,
          paddingRight: HERO_CHAT_PILL_PADDING_INLINE_PX,
          paddingTop: HERO_CHAT_PILL_PADDING_BLOCK_PX,
          paddingBottom: HERO_CHAT_PILL_PADDING_BLOCK_PX,
          minHeight: HERO_CHAT_PILL_MIN_HEIGHT_PX,
          maxWidth: `min(${HERO_CHAT_PILL_MAX_WIDTH_PX}px, calc(100vw - 7rem))`,
          borderRadius: HERO_CHAT_PILL_BORDER_RADIUS_PX,
          boxShadow: HERO_CHAT_PILL_BOX_SHADOW,
        }}
      >
        <span className={HERO_CHAT_PILL_TEXT_CLASSNAME}>{t('home.promo_chat_pill_label')}</span>
      </span>
      <span className={`${HERO_CHAT_FAB_CIRCLE_CLASSNAME} ${HERO_CHAT_FAB_SIZE_CLASSNAME}`} aria-hidden>
        <svg
          className={HERO_CHAT_FAB_ICON_FRAME_CLASSNAME}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d={HERO_CHAT_FAB_MESSAGE_SOLID_PATH_D} fill={HERO_CHAT_FAB_ICON_FILL} />
        </svg>
      </span>
    </Link>
  );
}
