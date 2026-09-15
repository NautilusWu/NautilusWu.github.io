import { onReady, prefersReducedMotion } from './ready';

/**
 * Scroll reveals.
 *
 * Two passes, deliberately:
 *
 * 1. Anything already within the viewport is released synchronously, measured
 *    with `getBoundingClientRect`. An IntersectionObserver's first callback is
 *    an async task the browser is free to defer — under load, or in a
 *    background tab, it can be a long way off — and the first screen of the
 *    page must never wait on that. The elements still animate, because the
 *    class lands after the initial paint.
 * 2. Everything below the fold goes to one shared observer, and is unobserved
 *    the moment it lands, so the cost decays to zero as you read.
 */
onReady(() => {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!targets.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const fold = window.innerHeight;
  const below = targets.filter((el) => {
    const box = el.getBoundingClientRect();
    if (box.top < fold && box.bottom > 0) {
      el.classList.add('is-in');
      return false;
    }
    return true;
  });

  if (!below.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );

  below.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
});
