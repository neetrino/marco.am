'use client';

import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';
import { MARCO_FIGMA_FOOTER } from './marcoHomeAssets';

export function MarcoFigmaFooterAboutColumn() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="relative h-[81px] w-[91px] overflow-hidden">
        <Image
          src={MARCO_FIGMA_FOOTER.logo}
          alt=""
          fill
          className="object-contain object-left-top"
          unoptimized
        />
      </div>
      <p className="text-[14px] leading-[22.75px] text-gray-500">{t('home.figma_footer_about')}</p>
    </div>
  );
}
