import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fontData, type CssVariable } from 'astro:assets';

/**
 * The served URL of a Fontsource family's basic-Latin face, for preloading.
 *
 * `<Font preload>` cannot pick it out. The `npm` font provider reads the
 * package's `index.css` whole — `subsets` in the font config is ignored — and
 * tags no face with its subset, so a `{ subset: 'latin' }` filter matches
 * nothing and a bare `preload` preloads every face: Cyrillic, Greek,
 * Vietnamese, Latin Extended, and Latin. For Inter that was ~220 kB of
 * preloads on every page, competing with the page itself, where the text only
 * ever needs the 48 kB Latin file. (The other faces are still declared, each
 * behind its `unicode-range`, so a stray π still gets Inter's — the browser
 * fetches that subset only when a page actually uses it.)
 *
 * `fontData` lists faces in the order of that same `index.css`, so the Latin
 * face is found by its position there. If the two ever stop lining up, the
 * build fails instead of quietly preloading the wrong file.
 *
 * Resolved from the working directory for the same reason as `public-file.ts`.
 */
export function latinFontUrl(cssVariable: CssVariable, pkg: string): string {
  const css = readFileSync(join(process.cwd(), 'node_modules', pkg, 'index.css'), 'utf8');
  const faces = [...css.matchAll(/\/\*\s*(\S+)\s*\*\/\s*@font-face/g)].map((match) => match[1]);
  const index = faces.findIndex((face) => face.endsWith('-latin-wght-normal'));

  const data = fontData[cssVariable];
  const url = data.length === faces.length ? data[index]?.src[0]?.url : undefined;
  if (!url) {
    throw new Error(`No basic-Latin face for ${cssVariable} in ${pkg}/index.css to preload.`);
  }
  return url;
}
