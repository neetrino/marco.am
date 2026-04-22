import type { ReactNode } from 'react';

import { AdminThemeGuard } from './AdminThemeGuard';

export default function SupersudoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminThemeGuard />
      {children}
    </>
  );
}
