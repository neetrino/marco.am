'use client';

import { useEffect } from 'react';

/**
 * Supersudo admin must always stay in the light theme, regardless of the site theme.
 * When this route mounts we temporarily remove the global dark class; on unmount we
 * restore the user's previous theme choice.
 */
export function AdminThemeGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDarkClass = root.classList.contains('dark');
    const previousTheme = root.dataset.theme;
    const previousColorScheme = root.style.colorScheme;

    root.classList.remove('dark');
    root.dataset.theme = 'light';
    root.style.colorScheme = 'light';

    return () => {
      if (hadDarkClass) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      if (previousTheme) {
        root.dataset.theme = previousTheme;
      } else {
        delete root.dataset.theme;
      }

      root.style.colorScheme = previousColorScheme;
    };
  }, []);

  return null;
}
