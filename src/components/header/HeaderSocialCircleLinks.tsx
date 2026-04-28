'use client';

import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Send } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';

const SOCIAL_VECTOR_ICON_PX = 20;
const SOCIAL_LUCIDE_CLASS = 'shrink-0 text-marco-black dark:text-[#050505]';

function WhatsAppGlyph({ className, size = SOCIAL_VECTOR_ICON_PX }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="9 9 21 21"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M26.9397 12.0555C25.9721 11.0834 24.8197 10.3125 23.5496 9.78793C22.2796 9.26335 20.9173 8.99552 19.5422 9.00006C13.7804 9.00006 9.08442 13.6725 9.08442 19.4055C9.08442 21.243 9.56985 23.028 10.4774 24.603L9 30L14.5402 28.551C16.0704 29.3805 17.7905 29.8215 19.5422 29.8215C25.304 29.8215 30 25.149 30 19.416C30 16.6335 28.9131 14.019 26.9397 12.0555ZM19.5422 28.0575C17.9804 28.0575 16.4503 27.6375 15.11 26.85L14.7935 26.661L11.501 27.522L12.3769 24.33L12.1658 24.0045C11.2979 22.6259 10.8372 21.0323 10.8362 19.4055C10.8362 14.6385 14.7407 10.7536 19.5317 10.7536C21.8533 10.7536 24.0377 11.6565 25.6734 13.2945C26.4834 14.0966 27.1253 15.0507 27.5619 16.1015C27.9985 17.1524 28.221 18.279 28.2166 19.416C28.2377 24.183 24.3332 28.0575 19.5422 28.0575ZM24.3121 21.5895C24.0482 21.4635 22.7608 20.8335 22.5286 20.739C22.2859 20.655 22.1171 20.613 21.9377 20.865C21.7583 21.1275 21.2623 21.7155 21.1146 21.8835C20.9668 22.062 20.8085 22.083 20.5447 21.9465C20.2809 21.8205 19.4367 21.537 18.4447 20.655C17.6638 19.962 17.1467 19.1115 16.9884 18.849C16.8407 18.5865 16.9673 18.45 17.1045 18.3135C17.2206 18.198 17.3683 18.009 17.495 17.862C17.6216 17.715 17.6744 17.5995 17.7588 17.4315C17.8432 17.253 17.801 17.106 17.7377 16.98C17.6744 16.854 17.1467 15.573 16.9357 15.048C16.7246 14.544 16.503 14.607 16.3447 14.5965H15.8382C15.6588 14.5965 15.3844 14.6595 15.1417 14.922C14.9095 15.1845 14.2342 15.8145 14.2342 17.0955C14.2342 18.3765 15.1734 19.6155 15.3 19.7835C15.4266 19.962 17.1467 22.587 19.7638 23.7105C20.3864 23.9835 20.8719 24.141 21.2518 24.2565C21.8744 24.456 22.4442 24.4245 22.898 24.3615C23.4045 24.288 24.4492 23.7315 24.6603 23.1225C24.8819 22.5135 24.8819 21.999 24.808 21.8835C24.7342 21.768 24.5759 21.7155 24.3121 21.5895Z" />
    </svg>
  );
}

function ViberGlyph({ className, size = SOCIAL_VECTOR_ICON_PX }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 20.2189 21.9737"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.98733 4.55888C5.79261 4.53037 5.594 4.56957 5.42472 4.66994H5.41006C5.01718 4.90043 4.66306 5.19063 4.36133 5.53218C4.10989 5.82238 3.97369 6.11573 3.93807 6.39861C3.91711 6.56624 3.93178 6.73596 3.98102 6.89625L3.99988 6.90673C4.28275 7.73754 4.65154 8.53692 5.10204 9.28915C5.68318 10.3456 6.39799 11.3227 7.22882 12.1965L7.25397 12.2321L7.29378 12.2614L7.31788 12.2897L7.34721 12.3148C8.2241 13.1481 9.20352 13.8663 10.2619 14.4521C11.4719 15.1111 12.2063 15.4223 12.6474 15.5522V15.5585C12.7763 15.5983 12.8936 15.6161 13.012 15.6161C13.3878 15.5891 13.7436 15.4363 14.022 15.1823C14.3625 14.8806 14.6506 14.5255 14.8748 14.1305V14.1231C15.0854 13.725 15.0141 13.35 14.7103 13.0954C14.1005 12.5615 13.4406 12.0878 12.7396 11.681C12.2703 11.4264 11.7936 11.5804 11.6008 11.8382L11.1891 12.3578C10.9774 12.6155 10.594 12.5799 10.594 12.5799L10.5835 12.5862C7.72228 11.856 6.95852 8.95913 6.95852 8.95913C6.95852 8.95913 6.9229 8.56521 7.18797 8.36405L7.70342 7.94917C7.95068 7.74802 8.1225 7.27237 7.85743 6.80301C7.45154 6.10256 6.97894 5.44295 6.44621 4.83338C6.32968 4.69024 6.16648 4.59269 5.98523 4.55784M10.8224 3.29957C10.6834 3.29957 10.5502 3.35476 10.452 3.453C10.3537 3.55124 10.2985 3.68448 10.2985 3.82341C10.2985 3.96234 10.3537 4.09558 10.452 4.19382C10.5502 4.29206 10.6834 4.34725 10.8224 4.34725C12.1466 4.34725 13.2467 4.77994 14.1173 5.60971C14.5647 6.06335 14.9135 6.60081 15.1419 7.18961C15.3714 7.77945 15.4762 8.4091 15.4489 9.03981C15.4431 9.17874 15.4927 9.3143 15.5868 9.41666C15.6809 9.51903 15.8118 9.57981 15.9508 9.58565C16.0897 9.59148 16.2252 9.54189 16.3276 9.44777C16.43 9.35366 16.4908 9.22274 16.4966 9.08381C16.5278 8.30806 16.3991 7.53419 16.1184 6.81035C15.8364 6.08282 15.4069 5.4215 14.857 4.86795L14.8465 4.85747C13.7663 3.82551 12.4002 3.29957 10.8224 3.29957Z" />
      <path d="M10.7858 5.02152C10.6468 5.02152 10.5136 5.07671 10.4154 5.17494C10.3171 5.27318 10.2619 5.40642 10.2619 5.54536C10.2619 5.68429 10.3171 5.81753 10.4154 5.91577C10.5136 6.014 10.6468 6.06919 10.7858 6.06919H10.8036C11.7591 6.13729 12.4547 6.45579 12.9419 6.97858C13.4416 7.51709 13.7004 8.18655 13.6805 9.01422C13.6773 9.15315 13.7294 9.28766 13.8254 9.38816C13.9214 9.48866 14.0534 9.54691 14.1923 9.55011C14.3312 9.5533 14.4657 9.50118 14.5662 9.4052C14.6667 9.30922 14.725 9.17725 14.7282 9.03832C14.7533 7.95187 14.4034 7.0142 13.7098 6.26616V6.26406C13.0006 5.50345 12.0273 5.10114 10.856 5.02256L10.8382 5.02047L10.7858 5.02152Z" />
      <path d="M10.7663 6.77715C10.6962 6.77097 10.6256 6.77897 10.5587 6.80069C10.4917 6.8224 10.4298 6.85738 10.3767 6.90354C10.3236 6.9497 10.2803 7.00609 10.2495 7.06935C10.2186 7.1326 10.2008 7.20143 10.1972 7.27171C10.1935 7.34199 10.204 7.41229 10.2281 7.47841C10.2523 7.54453 10.2894 7.60511 10.3375 7.65654C10.3855 7.70797 10.4434 7.74919 10.5077 7.77775C10.5721 7.8063 10.6415 7.8216 10.7119 7.82274C11.1498 7.84579 11.4295 7.97779 11.6055 8.15485C11.7826 8.33296 11.9146 8.61897 11.9387 9.06633C11.94 9.13663 11.9554 9.20595 11.9841 9.27015C12.0128 9.33435 12.0541 9.39213 12.1055 9.44003C12.157 9.48794 12.2176 9.52499 12.2837 9.54898C12.3498 9.57298 12.42 9.58342 12.4902 9.57969C12.5604 9.57596 12.6292 9.55814 12.6923 9.52728C12.7555 9.49642 12.8118 9.45316 12.8579 9.40007C12.904 9.34699 12.939 9.28516 12.9607 9.21829C12.9824 9.15141 12.9904 9.08085 12.9843 9.0108C12.9507 8.3822 12.7538 7.82693 12.3504 7.41833C11.945 7.00974 11.3928 6.81068 10.7663 6.77715Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M5.04703 0.558907C8.38082 -0.186302 11.838 -0.186302 15.1718 0.558907L15.527 0.637483C16.5013 0.855901 17.396 1.33988 18.1121 2.03576C18.8281 2.73164 19.3374 3.61223 19.5836 4.5799C20.4306 7.91445 20.4306 11.4078 19.5836 14.7424C19.3374 15.71 18.8281 16.5906 18.1121 17.2865C17.396 17.9824 16.5013 18.4664 15.527 18.6848L15.1708 18.7634C13.0827 19.2296 10.9402 19.4056 8.80401 19.2862L6.02452 21.7734C5.91973 21.8672 5.79168 21.9311 5.65373 21.9586C5.51578 21.986 5.373 21.976 5.24028 21.9294C5.10755 21.8828 4.98976 21.8015 4.89919 21.6939C4.80863 21.5863 4.74861 21.4563 4.7254 21.3176L4.26547 18.5706C3.38375 18.2957 2.58716 17.7996 1.95167 17.1294C1.31617 16.4592 0.862959 15.6374 0.635259 14.7424C-0.211753 11.4078 -0.211753 7.91445 0.635259 4.5799C0.881401 3.61223 1.39073 2.73164 2.10677 2.03576C2.8228 1.33988 3.71758 0.855901 4.69187 0.637483L5.04703 0.558907ZM14.8292 2.09166C11.721 1.39685 8.4978 1.39685 5.38963 2.09166L5.03341 2.17128C4.34295 2.32653 3.70892 2.66983 3.20153 3.16318C2.69413 3.65652 2.33316 4.28066 2.15858 4.96649C1.37596 8.04733 1.37596 11.2749 2.15858 14.3558C2.33324 15.0418 2.69437 15.666 3.20196 16.1593C3.70956 16.6527 4.34381 16.9959 5.03446 17.151L5.12875 17.1719C5.28129 17.2061 5.42018 17.2849 5.52768 17.3984C5.63518 17.5118 5.70639 17.6548 5.73222 17.8089L6.04023 19.6508L8.00149 17.8959C8.07981 17.8256 8.17145 17.7718 8.27097 17.7376C8.3705 17.7034 8.47587 17.6895 8.58085 17.6968C10.6752 17.8447 12.78 17.6877 14.8292 17.2306L15.1844 17.151C15.875 16.9959 16.5093 16.6527 17.0169 16.1593C17.5245 15.666 17.8856 15.0418 18.0603 14.3558C18.8418 11.2756 18.8418 8.04771 18.0603 4.96649C17.8856 4.28053 17.5245 3.6563 17.0169 3.16294C16.5093 2.66959 15.875 2.32636 15.1844 2.17128L14.8292 2.09166Z" />
    </svg>
  );
}

type LucideSocialEntry = {
  translationKey: string;
  ariaKey: string;
  Icon: LucideIcon;
};

type GlyphSocialEntry = {
  translationKey: string;
  ariaKey: string;
  Glyph: (props: { className?: string; size?: number }) => JSX.Element;
};

type SocialEntry = LucideSocialEntry | GlyphSocialEntry;

const SOCIAL_ENTRIES: SocialEntry[] = [
  { translationKey: 'contact.social.instagram', Icon: Instagram, ariaKey: 'common.ariaLabels.instagram' },
  { translationKey: 'contact.social.facebook', Icon: Facebook, ariaKey: 'common.ariaLabels.facebook' },
  { translationKey: 'contact.social.telegram', Icon: Send, ariaKey: 'common.ariaLabels.telegram' },
  {
    translationKey: 'contact.social.whatsapp',
    ariaKey: 'common.ariaLabels.whatsapp',
    Glyph: WhatsAppGlyph,
  },
  {
    translationKey: 'contact.social.viber',
    ariaKey: 'common.ariaLabels.viber',
    Glyph: ViberGlyph,
  },
];

function isGlyphEntry(entry: SocialEntry): entry is GlyphSocialEntry {
  return 'Glyph' in entry;
}

function socialControlClass(
  _entry: SocialEntry,
  enabled: boolean,
  desktopBalancedIcons: boolean,
  comfortableTouch: boolean
): string {
  const touch = comfortableTouch ? 'h-12 w-12' : 'h-11 w-11';
  const base = `flex ${touch} shrink-0 items-center justify-center rounded-full border border-marco-black/10 bg-marco-yellow text-marco-black transition-[opacity,filter,transform] dark:border-marco-black/15 dark:bg-marco-yellow dark:text-[#050505]`;
  const desktopCompact =
    desktopBalancedIcons &&
    'min-[1367px]:h-9 min-[1367px]:w-9 min-[1367px]:[&_svg]:!h-[14px] min-[1367px]:[&_svg]:!w-[14px] min-[1367px]:[&_svg]:!max-h-[14px] min-[1367px]:[&_svg]:!max-w-[14px]';
  return [base, desktopCompact, enabled ? 'hover:brightness-95 active:brightness-90 hover:-translate-y-0.5' : 'opacity-40']
    .filter(Boolean)
    .join(' ');
}

function SocialGlyph({ entry, iconPx }: { entry: SocialEntry; iconPx: number }) {
  if (isGlyphEntry(entry)) {
    const { Glyph } = entry;
    return (
      <Glyph className="shrink-0 text-marco-black transition-colors dark:text-[#050505]" size={iconPx} />
    );
  }
  const { Icon } = entry;
  return (
    <Icon
      size={iconPx}
      className={SOCIAL_LUCIDE_CLASS}
      strokeWidth={2.1}
      aria-hidden
    />
  );
}

interface HeaderSocialCircleLinksProps {
  className?: string;
  /** Wide desktop (≥1367px): smaller yellow pill + glyph — header row only; drawer omits this */
  desktopBalancedIcons?: boolean;
  /** Mobile drawer: slightly larger hit targets and glyphs */
  comfortableTouch?: boolean;
}

/** Round social buttons — MARCO yellow pills */
export function HeaderSocialCircleLinks({
  className = '',
  desktopBalancedIcons = false,
  comfortableTouch = false,
}: HeaderSocialCircleLinksProps) {
  const { t } = useTranslation();
  const iconPx = comfortableTouch ? 22 : SOCIAL_VECTOR_ICON_PX;
  const gapClass = comfortableTouch ? 'gap-7' : 'gap-6';

  return (
    <div
      className={`flex shrink-0 items-center ${gapClass} ${desktopBalancedIcons ? 'min-[1367px]:gap-4' : ''} ${className}`}
      role="list"
      aria-label={t('common.ariaLabels.socialLinks')}
    >
      {SOCIAL_ENTRIES.map((entry) => {
        const { translationKey, ariaKey } = entry;
        const href = t(translationKey)?.trim();
        const hasHref = href.length > 0 && href !== '#';
        const name = t(ariaKey);

        const inner = <SocialGlyph entry={entry} iconPx={iconPx} />;
        const surfaceClass = socialControlClass(entry, hasHref, desktopBalancedIcons, comfortableTouch);

        if (!hasHref) {
          return (
            <span
              key={translationKey}
              role="listitem"
              className={surfaceClass}
              aria-label={name}
            >
              {inner}
            </span>
          );
        }

        return (
          <a
            key={translationKey}
            role="listitem"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={surfaceClass}
            aria-label={name}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
