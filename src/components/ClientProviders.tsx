'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { LanguagePreferenceCookieSync } from './LanguagePreferenceCookieSync';
import { ToastContainer } from './Toast';
import { ThemeProvider } from './theme/ThemeProvider';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguagePreferenceCookieSync />
        {children}
        <ToastContainer />
      </AuthProvider>
    </ThemeProvider>
  );
}
