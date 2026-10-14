// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * https://astro.build/config
 *
 * Notes on the choices here:
 * - `fonts` uses Astro's built-in font pipeline against locally installed
 *   `@fontsource-variable` packages, so the build never talks to a font CDN and
 *   the served files are subset, self-hosted, and paired with metric-matched
 *   fallbacks (no layout shift while webfonts load).
 * - `prefetch` warms same-origin links as they enter the viewport, which makes
 *   the view transitions in `BaseLayout` feel instant.
 */
export default defineConfig({
  // GitHub Pages user site. It drives canonical URLs, sitemap.xml, the RSS
  // feed, and Open Graph image URLs — change it if the site moves to a custom domain.
  site: 'https://nautiluswu.github.io',

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      /* Every other URL this site emits — canonical links, the RSS feed, the
         nav — is written without a trailing slash. The sitemap defaults to the
         directory form (`/research/`), which would be the one place disagreeing
         with the canonical and is exactly what produces duplicate-URL warnings
         in Search Console. Normalise it to match. */
      serialize: (item) => ({ ...item, url: item.url.replace(/(.+)\/$/, '$1') }),
    }),
  ],

  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  /* Old addresses land somewhere sensible rather than breaking: Research and
     Projects became Experience, and About became a section of the home page. */
  redirects: {
    '/research': '/experience',
    '/projects': '/experience',
    '/about': '/#about',
    '/cv': '/resume',
    '/notes': '/writing',
  },

  build: { inlineStylesheets: 'auto' },

  markdown: {
    /* Astro's native Sätteri pipeline, used as-is. Heading anchors used to be
       a hast plugin here; they are added in `scripts/prose.ts` instead because
       Astro assigns heading ids *after* every user plugin has run, so a plugin
       cannot read the id it needs — and anything injected into a heading at
       build time also ends up in the text Astro slugs and in the headings it
       hands to the table of contents. */
    shikiConfig: {
      // Dual themes: Shiki emits both palettes as CSS variables and
      // `global.css` swaps them with the site theme. No FOUC, no JS.
      themes: { light: 'github-light-default', dark: 'github-dark-dimmed' },
      defaultColor: 'light',
      wrap: false,
    },
  },

  fonts: [
    {
      provider: fontProviders.npm(),
      name: 'Inter Variable',
      cssVariable: '--font-sans',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      options: { package: '@fontsource-variable/inter' },
    },
    {
      provider: fontProviders.npm(),
      name: 'JetBrains Mono Variable',
      cssVariable: '--font-mono',
      weights: ['100 800'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      options: { package: '@fontsource-variable/jetbrains-mono' },
    },
  ],
});
