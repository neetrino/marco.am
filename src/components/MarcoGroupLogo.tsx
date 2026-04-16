import Image from 'next/image';
import { HEADER_LOGO_HEIGHT_PX, HEADER_LOGO_WIDTH_PX } from '@/constants/headerLogo';

type MarcoGroupLogoProps = {
  className?: string;
  priority?: boolean;
};

export function MarcoGroupLogo({ className = '', priority = false }: MarcoGroupLogoProps) {
  return (
    <Image
      src="/images/marco-group-logo.png"
      alt="MARCO GROUP"
      width={HEADER_LOGO_WIDTH_PX}
      height={HEADER_LOGO_HEIGHT_PX}
      className={`object-contain ${className}`.trim()}
      priority={priority}
    />
  );
}
