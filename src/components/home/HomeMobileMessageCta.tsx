'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTranslation } from '../../lib/i18n-client';
import {
  HOME_MOBILE_MESSAGE_CTA_HREF,
  HOME_MOBILE_MESSAGE_CTA_ICON_PX,
  HOME_MOBILE_MESSAGE_CTA_ICON_SRC,
  HOME_MOBILE_MESSAGE_CTA_OUTER_PX,
} from './home-mobile-message-cta.constants';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home-page-section-shell.constants';

const SECTION_CONTAINER_CLASS = HOME_PAGE_SECTION_SHELL_CLASS;

const LINK_FOCUS_CLASS =
  'rounded-full -translate-x-[4px] bg-transparent transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

/**
 * Mobile-only: yellow circle + message icon, before special offers.
 */
export function HomeMobileMessageCta() {
  const { t } = useTranslation();

  return (
    <section className="relative z-0 md:hidden -translate-y-[15px] pb-4 pt-2">
      <div className={SECTION_CONTAINER_CLASS}>
        <div className="flex justify-end">
          <Link
            href={HOME_MOBILE_MESSAGE_CTA_HREF}
            className={LINK_FOCUS_CLASS}
            aria-label={t('home.promo_chat_aria')}
          >
            <span
              className="relative flex shrink-0 items-center justify-center rounded-full bg-marco-yellow"
              style={{
                width: HOME_MOBILE_MESSAGE_CTA_OUTER_PX,
                height: HOME_MOBILE_MESSAGE_CTA_OUTER_PX,
              }}
            >
              <Image
                src={HOME_MOBILE_MESSAGE_CTA_ICON_SRC}
                alt=""
                width={HOME_MOBILE_MESSAGE_CTA_ICON_PX}
                height={HOME_MOBILE_MESSAGE_CTA_ICON_PX}
                style={{
                  width: HOME_MOBILE_MESSAGE_CTA_ICON_PX,
                  height: HOME_MOBILE_MESSAGE_CTA_ICON_PX,
                }}
                className="shrink-0"
                unoptimized
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
