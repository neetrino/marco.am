'use client';

import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';
import { MARCO_FIGMA_FOOTER } from './marcoHomeAssets';

export function MarcoFigmaFooterContactColumn() {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.7px] text-[#181111]">
        {t('home.figma_footer_contacts')}
      </h3>
      <p className="mb-4 text-[14px] text-gray-500">{t('home.figma_footer_address')}</p>
      <div className="mb-3 flex items-start gap-2">
        <Image
          src={MARCO_FIGMA_FOOTER.phoneIcon}
          alt=""
          width={15}
          height={15}
          className="mt-0.5 shrink-0"
          unoptimized
        />
        <a href="tel:+37410000000" className="text-[14px] font-bold text-[#181111]">
          +374 10 000 000
        </a>
      </div>
      <div className="flex items-start gap-2">
        <Image
          src={MARCO_FIGMA_FOOTER.emailVector}
          alt=""
          width={14}
          height={14}
          className="mt-0.5 shrink-0"
          unoptimized
        />
        <a href="mailto:info@marco.am" className="text-[14px] text-gray-500">
          info@marco.am
        </a>
      </div>
    </div>
  );
}
