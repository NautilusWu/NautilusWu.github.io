import { onReady } from './ready';

/**
 * Theme toggle.
 *
 * The initial theme is set by a blocking inline script in `BaseHead.astro` —
 * this module only handles the switch. Where the browser supports the View
 * Transition API the new theme is revealed as a circle expanding out of the
 * button that was pressed, which reads as a deliberate change rather than a
 * flash. Everywhere else the attribute just flips.
 */
const STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark';

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing modes can throw on write; the theme still applies.
  }
}

onReady(() => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

  const handler = (event: MouseEvent) => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsTransition = 'startViewTransition' in document;

    if (reduced || !supportsTransition) {
      apply(next);
      return;
    }

    // Expand from the pointer, or from the button's centre for keyboard use.
    const target = event.currentTarget as HTMLElement;
    const box = target.getBoundingClientRect();
    const x = event.clientX || box.left + box.width / 2;
    const y = event.clientY || box.top + box.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    document.documentElement.style.setProperty('--reveal-x', `${x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${y}px`);
    document.documentElement.style.setProperty('--reveal-r', `${radius}px`);
    document.documentElement.dataset.themeTransition = '';

    const transition = (
      document as Document & {
        startViewTransition: (cb: () => void) => {
          ready: Promise<void>;
          updateCallbackDone: Promise<void>;
          finished: Promise<void>;
        };
      }
    ).startViewTransition(() => apply(next));

    /* A ViewTransition exposes three promises, and every one of them needs a
       rejection handler even when its value is not wanted. `ready` rejects
       whenever the transition is skipped — which is exactly what happens when
       this button is clicked twice in quick succession, since the second call
       supersedes the first. Nothing here reads `ready`, so that rejection had
       no handler and surfaced as an unhandled promise rejection on every
       double-click. Measured: five rapid clicks produced five of them. */
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});

    /* Same hazard as client-side navigation (see `navigation-watchdog.ts`): if
       the transition never settles — backgrounded tab, stalled compositor —
       `finished` never resolves, and the flag that drives the circular-reveal
       keyframes would stay on <html> forever. Clear it either way. */
    const clearFlag = () => {
      delete document.documentElement.dataset.themeTransition;
    };

    const guard = window.setTimeout(clearFlag, 2000);

    const settle = () => {
      window.clearTimeout(guard);
      clearFlag();
    };

    /* `then(settle, settle)` rather than `.finally(settle)`. Starting a view
       transition while one is already running skips the earlier one, and its
       `finished` promise rejects with an AbortError — `.finally()` passes that
       rejection straight through, so a double-click on this button logged an
       unhandled rejection every time. Handling both outcomes keeps the console
       clean, and the end state is already correct either way. */
    transition.finished.then(settle, settle);
  };

  buttons.forEach((button) => button.addEventListener('click', handler));

  // Track the OS preference for anyone who has never pressed the button.
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event: MediaQueryListEvent) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!stored) document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  };
  system.addEventListener('change', onSystemChange);

  return () => {
    buttons.forEach((button) => button.removeEventListener('click', handler));
    system.removeEventListener('change', onSystemChange);
  };
});
