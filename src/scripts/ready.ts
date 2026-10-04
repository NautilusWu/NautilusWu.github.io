/**
 * Astro's view transitions swap `<body>` without reloading the document, so
 * every module below binds through this helper instead of running once at
 * import time.
 *
 * Each module binds once per page, and "page" means the `<body>` element: the
 * router replaces it on every navigation. That key is what lets the two
 * triggers below coexist:
 *
 * - On a cold load the module binds as soon as it runs. Module scripts are
 *   deferred, so the DOM is already complete. It does not wait for the
 *   router's first `astro:page-load`, which is tied to `window.load` — every
 *   font and subresource — and waiting for it held all `[data-reveal]` content
 *   at `opacity: 0` until the slowest font had arrived.
 * - After a navigation, `astro:page-load` binds the new page. A module that
 *   the navigation itself loaded has already bound by the time that event
 *   fires, and without the key it would bind twice.
 *
 * Anything that must be torn down between pages registers a cleanup, which is
 * run just before the next swap.
 */
type Cleanup = () => void;

const cleanups = new Set<Cleanup>();

export function onReady(fn: () => Cleanup | void): void {
  let boundTo: HTMLElement | null = null;

  const run = () => {
    if (boundTo === document.body) return;
    boundTo = document.body;
    const cleanup = fn();
    if (cleanup) cleanups.add(cleanup);
  };

  document.addEventListener('astro:page-load', run);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

document.addEventListener('astro:before-swap', () => {
  for (const cleanup of cleanups) cleanup();
  cleanups.clear();
});

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
