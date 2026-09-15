import { onReady } from './ready';

/**
 * Header chrome: the "has scrolled" state, the sliding nav indicator, the
 * mobile drawer, and the rAF fallback for the scroll-progress bar.
 *
 * Grouped into one module because they all read the same scroll position and
 * the same nav DOM — splitting them would mean three listeners where one does.
 */
onReady(() => {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const links = document.querySelector<HTMLElement>('[data-nav-links]');
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const drawer = document.querySelector<HTMLDialogElement>('[data-drawer]');
  const drawerToggle = document.querySelector<HTMLButtonElement>('[data-drawer-toggle]');

  const cleanups: Array<() => void> = [];

  /* — Active link ————————————————————————————————————————————————
     The header is `transition:persist`, so it survives a client-side
     navigation untouched — including the `aria-current` the server rendered
     for whichever page was loaded first. This makes the client the source of
     truth after the initial paint. (The server-side pass in `Header.astro`
     still matters: it is what a no-JS visitor and the first paint get.) */

  const syncCurrent = () => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const isCurrent = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

    document.querySelectorAll<HTMLAnchorElement>('.nav-link, .drawer-link').forEach((link) => {
      const href = link.getAttribute('href') ?? '';
      if (isCurrent(href)) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  syncCurrent();

  /* — Sliding indicator under the active nav link ———————————————— */

  const moveIndicator = () => {
    if (!links) return;
    const active = links.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) {
      links.style.setProperty('--nav-o', '0');
      return;
    }
    const parent = links.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    links.style.setProperty('--nav-x', `${box.left - parent.left}px`);
    links.style.setProperty('--nav-w', `${box.width}px`);
    links.style.setProperty('--nav-o', '1');
    links.dataset.ready = '';
  };

  if (links) {
    // Wait for fonts so the measurement is taken against final metrics.
    if (document.fonts?.status === 'loaded') moveIndicator();
    else void document.fonts?.ready.then(moveIndicator);
    moveIndicator();

    const observer = new ResizeObserver(moveIndicator);
    observer.observe(links);
    cleanups.push(() => observer.disconnect());
  }

  /* — Scroll state ———————————————————————————————————————————— */

  /* `--progress` is maintained unconditionally rather than behind a
     `CSS.supports('animation-timeline', ...)` check.

     The check was worse than useless: it reported support while the built
     stylesheet's scroll-driven animation was silently invalid (the minifier
     had folded `animation-timeline` into the `animation` shorthand, which the
     browser then dropped), so the one situation that needed a fallback was
     exactly the situation where the fallback was disabled. Feature detection
     answers "can the browser do this", not "is my CSS actually working".

     Writing it always is safe: where the CSS animation does work it wins the
     cascade over the base `transform: scaleX(var(--progress))`, because
     animations beat normal declarations. */

  /* `scrollHeight` forces a layout, so it is cached here and refreshed when
     the document actually changes size rather than read on every scroll
     event. That is what makes the handler cheap enough to run directly. */
  let maxScroll = 0;
  const measure = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  };

  const onScroll = () => {
    const y = window.scrollY;

    if (header) {
      if (y > 8) header.dataset.stuck = '';
      else delete header.dataset.stuck;
    }

    if (progress) {
      progress.style.setProperty(
        '--progress',
        String(maxScroll > 0 ? Math.min(1, y / maxScroll) : 0),
      );
    }
  };

  /* Deliberately not coalesced through requestAnimationFrame. The earlier
     version set a `ticking` flag before scheduling a frame and cleared it
     inside the callback — so if that frame never ran (a background tab, a
     stalled compositor) the flag stayed set and the scroll handler was dead
     for the rest of the page's life, taking the header state and the progress
     bar with it. The work here is two style writes against a cached
     measurement, which is cheaper than the bookkeeping was. */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  cleanups.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
  });

  /* Content height changes (reveals landing, fonts settling) move the scroll
     range, so re-measure when the document box does. */
  const heightObserver = new ResizeObserver(() => {
    measure();
    onScroll();
  });
  heightObserver.observe(document.documentElement);
  cleanups.push(() => heightObserver.disconnect());

  measure();
  onScroll();

  /* — Mobile drawer ——————————————————————————————————————————— */

  if (drawer && drawerToggle) {
    /* `showModal()` gives a focus trap, Escape handling, and an inert page for
       free. All this has to add is the scroll lock and the aria-expanded state
       on the trigger. */
    const open = () => {
      if (drawer.open) return;
      drawer.showModal();
      drawerToggle.setAttribute('aria-expanded', 'true');
      document.body.dataset.scrollLocked = '';
    };

    /* The closed state is applied on the path this module controls, not only
       from the dialog's `close` event — that event is not reliably delivered
       across engines, and a missed one would leave `overflow: hidden` on
       <body> and the page permanently unscrollable. */
    const applyClosedState = () => {
      drawerToggle.setAttribute('aria-expanded', 'false');
      delete document.body.dataset.scrollLocked;
    };

    const close = () => {
      if (drawer.open) drawer.close();
      applyClosedState();
    };

    // Backstop for a dismissal the browser initiates on its own.
    const onClose = applyClosedState;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawer.open) {
        event.preventDefault();
        close();
        drawerToggle.focus();
      }
    };

    const onDrawerClick = (event: MouseEvent) => {
      // A tapped link, the close button, or the backdrop itself.
      const target = event.target as HTMLElement;
      if (target.closest('a') || target.closest('[data-drawer-close]') || target === drawer) {
        close();
      }
    };

    drawerToggle.addEventListener('click', open);
    drawer.addEventListener('click', onDrawerClick);
    drawer.addEventListener('close', onClose);
    document.addEventListener('keydown', onKey);

    // A viewport that grows past the breakpoint should not leave it stuck open.
    const wide = window.matchMedia('(min-width: 46.001rem)');
    wide.addEventListener('change', close);

    cleanups.push(() => {
      close();
      drawerToggle.removeEventListener('click', open);
      drawer.removeEventListener('click', onDrawerClick);
      drawer.removeEventListener('close', onClose);
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', close);
      delete document.body.dataset.scrollLocked;
    });
  }

  return () => cleanups.forEach((fn) => fn());
});
