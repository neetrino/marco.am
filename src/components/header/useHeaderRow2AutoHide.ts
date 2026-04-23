'use client';

import { useLayoutEffect, useRef, useState } from 'react';

type UseHeaderRow2AutoHideOptions = {
  isBlocked: boolean;
  alwaysShowAtTopPx?: number;
  microScrollThresholdPx?: number;
  hideAfterDownScrollPx?: number;
  showAfterUpScrollPx?: number;
  oppositeActionSuppressMs?: number;
  transitionLockMs?: number;
};

/**
 * Stable auto-hide/show controller for header row2.
 * Uses RAF-throttled scroll handling with thresholds and debounce guards.
 */
export function useHeaderRow2AutoHide({
  isBlocked,
  alwaysShowAtTopPx = 12,
  microScrollThresholdPx = 2,
  hideAfterDownScrollPx = 18,
  showAfterUpScrollPx = 14,
  oppositeActionSuppressMs = 260,
  transitionLockMs = 220,
}: UseHeaderRow2AutoHideOptions): boolean {
  const [isHidden, setIsHidden] = useState(false);
  const isHiddenRef = useRef(false);
  const isBlockedRef = useRef(isBlocked);
  const lastScrollYRef = useRef(0);
  const downAccumPxRef = useRef(0);
  const upAccumPxRef = useRef(0);
  const suppressShowUntilRef = useRef(0);
  const suppressHideUntilRef = useRef(0);
  const transitionLockUntilRef = useRef(0);
  const rafPendingRef = useRef(false);

  const resetAccum = () => {
    downAccumPxRef.current = 0;
    upAccumPxRef.current = 0;
  };

  const setHiddenSafe = (nextHidden: boolean) => {
    if (isHiddenRef.current === nextHidden) {
      return;
    }
    isHiddenRef.current = nextHidden;
    setIsHidden(nextHidden);
    transitionLockUntilRef.current = performance.now() + transitionLockMs;
  };

  useLayoutEffect(() => {
    const y = window.scrollY;
    const nextHidden = !isBlocked && y > alwaysShowAtTopPx;
    isHiddenRef.current = nextHidden;
    setIsHidden(nextHidden);
    lastScrollYRef.current = y;
    resetAccum();
    suppressShowUntilRef.current = 0;
    suppressHideUntilRef.current = 0;
    transitionLockUntilRef.current = 0;
  }, [alwaysShowAtTopPx, isBlocked]);

  useLayoutEffect(() => {
    isHiddenRef.current = isHidden;
  }, [isHidden]);

  useLayoutEffect(() => {
    isBlockedRef.current = isBlocked;
    if (!isBlocked) {
      return;
    }
    setHiddenSafe(false);
    resetAccum();
    suppressShowUntilRef.current = 0;
    suppressHideUntilRef.current = 0;
    transitionLockUntilRef.current = 0;
    lastScrollYRef.current = window.scrollY;
  }, [isBlocked, transitionLockMs]);

  useLayoutEffect(() => {
    let rafId = 0;

    const applyScroll = () => {
      const y = window.scrollY;
      const deltaY = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      const now = performance.now();

      if (isBlockedRef.current) {
        setHiddenSafe(false);
        resetAccum();
        return;
      }
      if (now < transitionLockUntilRef.current) {
        return;
      }

      if (y <= alwaysShowAtTopPx) {
        setHiddenSafe(false);
        resetAccum();
        suppressShowUntilRef.current = 0;
        suppressHideUntilRef.current = 0;
        return;
      }

      if (Math.abs(deltaY) < microScrollThresholdPx) {
        return;
      }

      if (deltaY > 0) {
        if (isHiddenRef.current || now < suppressHideUntilRef.current) {
          return;
        }
        downAccumPxRef.current += deltaY;
        upAccumPxRef.current = 0;
        if (downAccumPxRef.current < hideAfterDownScrollPx) {
          return;
        }
        setHiddenSafe(true);
        resetAccum();
        suppressShowUntilRef.current = now + oppositeActionSuppressMs;
        return;
      }

      if (!isHiddenRef.current || now < suppressShowUntilRef.current) {
        return;
      }
      upAccumPxRef.current += -deltaY;
      downAccumPxRef.current = 0;
      if (upAccumPxRef.current < showAfterUpScrollPx) {
        return;
      }
      setHiddenSafe(false);
      resetAccum();
      suppressHideUntilRef.current = now + oppositeActionSuppressMs;
    };

    const scheduleScroll = () => {
      if (rafPendingRef.current) {
        return;
      }
      rafPendingRef.current = true;
      rafId = requestAnimationFrame(() => {
        rafPendingRef.current = false;
        applyScroll();
      });
    };

    window.addEventListener('scroll', scheduleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleScroll);
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    alwaysShowAtTopPx,
    microScrollThresholdPx,
    hideAfterDownScrollPx,
    oppositeActionSuppressMs,
    showAfterUpScrollPx,
    transitionLockMs,
  ]);

  return isHidden;
}
