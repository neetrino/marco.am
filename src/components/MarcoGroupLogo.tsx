import Image from 'next/image';
import { HEADER_LOGO_HEIGHT_PX, HEADER_LOGO_WIDTH_PX } from '@/constants/headerLogo';
import { SITE_LOGO_SRC } from '@/lib/constants/site-brand';

type MarcoGroupLogoProps = {
  className?: string;
  priority?: boolean;
};

export function MarcoGroupLogo({ className = '', priority = false }: MarcoGroupLogoProps) {
  return (
    <Image
      src={SITE_LOGO_SRC}
      alt="MARCO GROUP"
      width={HEADER_LOGO_WIDTH_PX}
      height={HEADER_LOGO_HEIGHT_PX}
      className={`object-contain ${className}`.trim()}
      priority={priority}
    />
  );
}
