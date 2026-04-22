'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

type ThemeToggleButtonProps = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
};

export function ThemeToggleButton({
  className = '',
  iconClassName = 'h-5 w-5',
  labelClassName = '',
  showLabel = false,
}: ThemeToggleButtonProps) {
  const { theme, mounted, toggleTheme } = useTheme();

  const isDark = mounted ? theme === 'dark' : false;
  const nextThemeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun className={iconClassName} strokeWidth={1.8} aria-hidden />
      ) : (
        <Moon className={iconClassName} strokeWidth={1.8} aria-hidden />
      )}
      {showLabel ? (
        <span className={labelClassName}>{isDark ? 'Light mode' : 'Dark mode'}</span>
      ) : null}
    </button>
  );
}
