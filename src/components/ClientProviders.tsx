'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { CartSummaryProvider } from '../lib/cart/cart-summary-context';
import { LanguagePreferenceCookieSync } from './LanguagePreferenceCookieSync';
import { LanguageRouterRefresh } from './LanguageRouterRefresh';
import { QueryProvider } from './QueryProvider';
import { ToastContainer } from './Toast';
import { ThemeProvider } from './theme/ThemeProvider';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <CartSummaryProvider>
            <LanguagePreferenceCookieSync />
            <LanguageRouterRefresh />
            {children}
            <ToastContainer />
          </CartSummaryProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
