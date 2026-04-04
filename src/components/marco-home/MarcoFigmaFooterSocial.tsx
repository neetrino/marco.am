'use client';

import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';
import { MARCO_FIGMA_FOOTER } from './marcoHomeAssets';

export function MarcoFigmaFooterSocial() {
  const { t } = useTranslation();
  const icons = [
    MARCO_FIGMA_FOOTER.social1,
    MARCO_FIGMA_FOOTER.social2,
    MARCO_FIGMA_FOOTER.social3,
    MARCO_FIGMA_FOOTER.social4,
  ];

  return (
    <div className="mx-auto mt-10 flex max-w-[1572px] flex-wrap items-center justify-between gap-4 px-8">
      <div className="flex gap-4">
        {icons.map((src) => (
          <span key={src} className="relative size-10 shrink-0">
            <Image src={src} alt="" fill className="object-contain" unoptimized />
          </span>
        ))}
        <span className="relative size-10 shrink-0 rounded-full bg-gold">
          <span className="absolute inset-[22%_24%_22%_25%]">
            <Image src={MARCO_FIGMA_FOOTER.social5} alt="" fill className="object-contain" unoptimized />
          </span>
        </span>
      </div>
      <p className="text-[14px] text-black">
        {t('home.figma_footer_copyright_prefix')}
        <a
          href="https://neetrino.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t('home.figma_footer_neetrino')}
        </a>
        {t('home.figma_footer_copyright_suffix')}
      </p>
    </div>
  );
}
