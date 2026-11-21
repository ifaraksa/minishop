import { useEffect } from 'react';

function hasScrollableAncestor(target: EventTarget | null, deltaY: number): boolean {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      const canScrollDown = deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      const canScrollUp = deltaY < 0 && node.scrollTop > 1;
      if (canScrollDown || canScrollUp) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Silky Lenis-style inertia scrolling using frame-rate-independent exponential damping.
 * Uses `behavior: 'instant'` per animation frame so browser CSS smooth-scroll never fights RAF.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let lastTime = 0;

    const getMaxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const stop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTime = 0;
    };

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;

      // Clamp target in case dynamic content resized the page mid-glide
      const maxScroll = getMaxScroll();
      if (targetY > maxScroll) targetY = maxScroll;

      // Soft exponential damping (silky deceleration across 60Hz / 120Hz / 144Hz displays)
      const ease = 1 - Math.exp(-7.8 * dt);
      const diff = targetY - currentY;

      if (Math.abs(diff) < 0.25) {
        currentY = targetY;
        window.scrollTo({ top: currentY, behavior: 'instant' });
        stop();
        return;
      }

      currentY += diff * ease;
      window.scrollTo({ top: currentY, behavior: 'instant' });
      rafId = window.requestAnimationFrame(tick);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || document.body.style.overflow === 'hidden') return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (hasScrollableAncestor(event.target, event.deltaY)) return;

      event.preventDefault();

      const deltaPx =
        event.deltaMode === 1
          ? event.deltaY * 36
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight * 0.85
            : event.deltaY;

      if (rafId === null) {
        currentY = window.scrollY;
        targetY = currentY;
        lastTime = 0;
      }

      targetY = Math.max(0, Math.min(getMaxScroll(), targetY + deltaPx));

      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const syncExternalScroll = () => {
      if (rafId === null && Math.abs(window.scrollY - currentY) > 2) {
        currentY = window.scrollY;
        targetY = currentY;
      }
    };

    const cancelOnManualInput = () => {
      stop();
      currentY = window.scrollY;
      targetY = currentY;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', syncExternalScroll, { passive: true });
    window.addEventListener('touchstart', cancelOnManualInput, { passive: true });
    window.addEventListener('mousedown', cancelOnManualInput, { passive: true });
    window.addEventListener('keydown', cancelOnManualInput, { passive: true });

    return () => {
      stop();
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', syncExternalScroll);
      window.removeEventListener('touchstart', cancelOnManualInput);
      window.removeEventListener('mousedown', cancelOnManualInput);
      window.removeEventListener('keydown', cancelOnManualInput);
    };
  }, [enabled]);
}
