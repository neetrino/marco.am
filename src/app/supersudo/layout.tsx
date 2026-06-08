import type { ReactNode } from 'react';

import { AdminLayoutClient } from './AdminLayoutClient';

export default function SupersudoLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
