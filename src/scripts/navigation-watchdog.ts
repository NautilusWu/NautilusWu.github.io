/**
 * A watchdog for client-side navigation.
 *
 * Astro's view-transition router performs the swap inside
 * `document.startViewTransition()`. If the browser never invokes that
 * callback — the tab was backgrounded mid-navigation, the compositor stalled,
 * a GPU process hiccuped — the router has no timeout and waits forever. The
 * failure mode is the worst available: rendering stays suppressed,
 * `data-astro-transition` is stuck on <html>, and every later click does
 * nothing. The page looks perfectly fine and is completely dead.
 *
 * This turns that dead end into an ordinary full page load.
 *
 * Two windows, because the two phases have very different expected durations:
 *
 * - From `astro:before-preparation`, the router is fetching the next document.
 *   That can legitimately take a while on a bad connection, so the guard here
 *   is generous.
 * - From `astro:after-preparation` the document is already in hand and only
 *   the transition remains, which should take a frame or two. A tight guard
 *   here is what makes recovery quick in the case that actually goes wrong.
 *
 * Registered at module scope deliberately: it must install exactly once per
 * document, not re-bind on every `astro:page-load` like the interaction
 * modules do.
 */

const FETCH_TIMEOUT_MS = 8000;
const SWAP_TIMEOUT_MS = 1200;

let timer = 0;
let destination: string | null = null;

const disarm = (): void => {
  window.clearTimeout(timer);
  timer = 0;
  destination = null;
};

const arm = (ms: number): void => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const href = destination;
    disarm();
    if (!href) return;

    // Clear the wedged transition state so the fallback load starts clean.
    document.documentElement.removeAttribute('data-astro-transition');
    window.location.assign(href);
  }, ms);
};

document.addEventListener('astro:before-preparation', (event) => {
  // `to` is the URL the router is navigating towards.
  const { to } = event as unknown as { to?: URL };
  destination = to?.href ?? null;
  if (destination) arm(FETCH_TIMEOUT_MS);
});

document.addEventListener('astro:after-preparation', () => {
  if (destination) arm(SWAP_TIMEOUT_MS);
});

/* `astro:after-swap` means the update callback ran and the new document is in
   place — past the point where a stall can strand the page. */
document.addEventListener('astro:after-swap', disarm);
document.addEventListener('astro:page-load', disarm);
