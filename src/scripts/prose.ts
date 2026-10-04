import { onReady } from './ready';

/**
 * Article body fixes that are easier to do against the rendered DOM than in
 * the Markdown pipeline:
 *
 * - headings get a hover-revealed `#` link;
 * - wide tables get their own horizontal scroll container, so a table can
 *   never make the whole page scroll sideways;
 * - code blocks get a copy button, in a wrapper that does not scroll.
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
    if (pre.parentElement?.classList.contains('code-block')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-btn';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');

    const status = document.createElement('span');
    status.className = 'visually-hidden';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');

    /* `textContent` of the <code>, which is the exact source text. Not
       `innerText`: that returns *rendered* text, and when the button still
       lived inside the <pre> it picked up the button's uppercased label, so
       every copied snippet ended in a stray COPY. */
    const codeOf = () => (pre.querySelector('code') ?? pre).textContent ?? '';

    let reset: number | undefined;
    const onClick = async () => {
      status.textContent = '';
      try {
        await navigator.clipboard.writeText(codeOf());
        button.textContent = 'Copied';
        button.setAttribute('aria-label', 'Copied code to clipboard');
        status.textContent = 'Code copied to clipboard.';
      } catch {
        // Clipboard access can be denied or unavailable. Leave the source
        // selected so the browser's normal copy shortcut still works.
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(pre.querySelector('code') ?? pre);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        button.textContent = selection ? 'Code selected' : 'Select code';
        const message = selection
          ? 'Code selected. Press Control+C or Command+C to copy.'
          : 'Select the code, then press Control+C or Command+C to copy.';
        button.setAttribute('aria-label', message);
        status.textContent = message;
      }
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
      }, 1600);
    };

    button.addEventListener('click', onClick);

    // Outside the <pre>, which scrolls sideways — see `.code-block`.
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.replaceWith(wrap);
    wrap.append(pre, button, status);

    cleanups.push(() => {
      button.removeEventListener('click', onClick);
      window.clearTimeout(reset);
    });
  });

  return () => cleanups.forEach((fn) => fn());
});
