import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Whether a file exists in `public/`, checked at build time.
 *
 * Used to decide whether to render the "Download PDF" button on /resume: a
 * portfolio site with a download link that 404s is worse than one with no
 * download link, and this way the button appears the moment the file is
 * dropped in and disappears if it is ever removed.
 *
 * Resolved from the working directory because this module is bundled — its own
 * `import.meta.url` points into the build output, not into `src/`. Both
 * `astro dev` and `astro build` run from the project root.
 */
export function publicFileExists(publicPath: string): boolean {
  if (!publicPath || !publicPath.startsWith('/')) return false;
  return existsSync(join(process.cwd(), 'public', publicPath.slice(1)));
}
