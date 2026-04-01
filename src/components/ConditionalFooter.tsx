'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/** На главной показывается футер из макета MARCO (`MarcoFigmaFooter`), глобальный скрыт. */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }
  return <Footer />;
}
