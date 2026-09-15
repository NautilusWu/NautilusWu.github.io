import { onReady } from './ready';

/**
 * Article body fixes that are easier to do against the rendered DOM than in
 * the Markdown pipeline:
 *
 * - headings get a hover-revealed `#` link;
 * - wide tables get their own horizontal scroll container, so a table can
 *   never make the whole page scroll sideways;
 * - code blocks get a copy button.
 *
 * The heading anchors were originally a build-time Markdown plugin, which
 * cannot work: Astro assigns heading ids after every user plugin has run, so
 * the plugin has no id to link to, and anything it injects into a heading is
 * then picked up as part of that heading's text — corrupting both the
 * generated slug and the table of contents. Here the ids are real DOM ids.
 * The anchor is a convenience, so needing JavaScript for it is fine; the ids
 * themselves are in the HTML, so deep links work regardless.
 */
onReady(() => {
  const prose = document.querySelector<HTMLElement>('.prose');
  if (!prose) return;

  prose.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id], h4[id]').forEach((heading) => {
    // GFM's own label for the footnote list is not a section of the article.
    if (heading.id === 'footnote-label') return;
    if (heading.querySelector('.heading-anchor')) return;

    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${heading.id}`;
    anchor.textContent = '#';
    anchor.setAttribute('aria-label', `Link to \u201c${heading.textContent?.trim() ?? ''}\u201d`);
    heading.prepend(anchor);
  });

  prose.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Table, scrollable');
    table.replaceWith(wrap);
    wrap.append(table);
  });

  const cleanups: Array<() => void> = [];

  prose.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-btn';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');

    /* Read the code out of <code>, not out of <pre>. The button lives inside
       the <pre>, so `pre.innerText` includes the button's own label — and
       `innerText` returns *rendered* text, so `text-transform: uppercase` on
       the button made that label "COPY" rather than "Copy". A regex stripping
       a trailing "Copy" therefore never matched, and every copied snippet came
       with a stray COPY (or COPIED, on the second click) glued to the end.
       `textContent` on the <code> element is the exact source text. */
    const codeOf = () => (pre.querySelector('code') ?? pre).textContent ?? '';

    let reset: number | undefined;
    const onClick = async () => {
      try {
        await navigator.clipboard.writeText(codeOf());
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Press ⌘C';
      }
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1600);
    };

    button.addEventListener('click', onClick);
    pre.style.position = 'relative';
    pre.append(button);

    cleanups.push(() => {
      button.removeEventListener('click', onClick);
      window.clearTimeout(reset);
    });
  });

  return () => cleanups.forEach((fn) => fn());
});
