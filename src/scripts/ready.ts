/**
 * Astro's view transitions swap `<body>` without reloading the document, so
 * every module below binds through this helper instead of running once at
 * import time. `astro:page-load` fires on the initial load *and* after each
 * navigation, which makes it the only lifecycle hook these modules need.
 *
 * Anything that must be torn down between pages registers a cleanup, which is
 * run just before the next swap.
 */
type Cleanup = () => void;

const cleanups = new Set<Cleanup>();

export function onReady(fn: () => Cleanup | void): void {
  const run = () => {
    const cleanup = fn();
    if (cleanup) cleanups.add(cleanup);
  };

  document.addEventListener('astro:page-load', run);

  // `astro:page-load` has already fired by the time a deferred module runs on
  // a cold load, so catch that case explicitly.
  if (document.readyState === 'complete') run();
}

document.addEventListener('astro:before-swap', () => {
  for (const cleanup of cleanups) cleanup();
  cleanups.clear();
});

/** Shorthand for a listener that is removed automatically on the next swap. */
export function listen<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement,
  type: K | string,
  handler: (event: never) => void,
  options?: AddEventListenerOptions,
): Cleanup {
  target.addEventListener(type, handler as EventListener, options);
  return () => target.removeEventListener(type, handler as EventListener, options);
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
