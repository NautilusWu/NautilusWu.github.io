import { onReady } from './ready';

/**
 * Marks the table-of-contents entry for the heading you are currently reading.
 *
 * Uses a rootMargin that pins the "read line" a third of the way down the
 * viewport, which matches where people actually look, and keeps the last
 * intersecting heading highlighted while scrolling through its body text.
 */
onReady(() => {
  const toc = document.querySelector<HTMLElement>('[data-toc]');
  if (!toc) return;

  const anchors = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchors.set(decodeURIComponent(anchor.hash.slice(1)), anchor);
  });

  const headings = [...anchors.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  if (!headings.length) return;

  let activeId = '';
  const setActive = (id: string) => {
    if (id === activeId) return;
    if (activeId) anchors.get(activeId)?.removeAttribute('aria-current');
    activeId = id;
    anchors.get(id)?.setAttribute('aria-current', 'true');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]) {
        setActive(visible[0].target.id);
        return;
      }

      // Nothing in the band: fall back to the last heading above it.
      const above = headings.filter((el) => el.getBoundingClientRect().top < 120).pop();
      if (above) setActive(above.id);
    },
    { rootMargin: '-12% 0px -66% 0px', threshold: 0 },
  );

  headings.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
});
