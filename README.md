# edwardwu.dev

A static personal / academic site built with [Astro](https://astro.build). **No framework
runtime ships to the browser** — every page is HTML, one stylesheet, and a handful of small
vanilla TypeScript modules.

## Quick start

```bash
npm install
npx astro dev --background   # http://localhost:4321
npx astro dev stop           # stop it again

npm run verify               # format check + type check + build
npm run build                # static output in dist/
```

## Editing the content

**Almost all text lives in [`src/data/site.ts`](src/data/site.ts).** Pages read from it, so
in normal use that is the only file to touch. Everything is `as const`, so a mistyped key is
a build error rather than a blank spot on the page.

| Export      | Used by                                        |
| ----------- | ---------------------------------------------- |
| `profile`   | hero, page titles, SEO description, CV header  |
| `contact`   | mail links, CV download                        |
| `socials`   | footer, contact lists on About and CV, JSON-LD |
| `nav`       | header, mobile drawer, footer                  |
| `focus`     | "What I work on" cards on the home page        |
| `readout`   | the instrument-style panel in the hero         |
| `education` | CV, Research → Training                        |
| `research`  | Research page, home page, CV                   |
| `projects`  | Projects page, CV                              |
| `skills`    | Research page, CV, home-page marquee           |
| `awards`    | CV                                             |
| `interests` | "Outside the lab" cards on About               |
| `now`       | the dated "Now" block on About                 |

Long-form posts are a content collection: add a `.mdx` file under
[`src/content/writing/`](src/content/writing/). Frontmatter is validated by Zod in
[`src/content.config.ts`](src/content.config.ts), and the index page, RSS feed, sitemap,
and social card all pick it up automatically. Set `draft: true` to hide a post without
deleting it.

### Before you publish

1. `contact.email` and the `socials[].href` handles in `src/data/site.ts`.
2. `site` in [`astro.config.mjs`](astro.config.mjs) — it drives canonical URLs, the
   sitemap, the RSS feed, and Open Graph image URLs.
3. Drop your CV PDF at `public/edward-wu-cv.pdf`. The download button only renders when
   that file actually exists, so a missing PDF can't ship as a dead link.
4. `education[].gpa` — fill it in or leave it empty to omit the line.

## Structure

```
src/
  data/site.ts              all site copy, typed
  content/writing/*.mdx     long-form posts (Zod-validated frontmatter)
  content.config.ts         collection schema
  layouts/BaseLayout.astro  document shell
  components/               BaseHead, Header, Footer, HeroField, Section, …
  scripts/                  one small client module per interaction
  lib/                      build-time helpers (OG cards, SEO, formatting)
  plugins/                  Sätteri heading-anchor plugin
  pages/
    index, research, projects, resume, about, 404
    writing/                index + [...slug]
    og/[...route].png.ts    build-time Open Graph cards
    rss.xml.ts, robots.txt.ts, manifest.webmanifest.ts
  styles/
    global.css              entry point; imports the five layers below
    tokens.css              custom properties only
    base.css                element defaults, page ground
    layout.css              shell, section rail, grids
    components.css          every named UI piece
    prose.css               article typography, TOC
    print.css               the CV's printed form
```

## Engineering notes

**Fonts.** Newsreader, Inter, and JetBrains Mono go through Astro's font pipeline against
locally installed `@fontsource-variable` packages. The build never contacts a font CDN, the
served files are latin-subset variable fonts, and Astro generates metric-matched fallbacks
so there is no layout shift while a webface loads.

**Client JavaScript.** One module per concern in `src/scripts/`, all bound through
`onReady()` so they re-initialise after a view transition and tear down cleanly before the
next one. The only blocking script on the page is the inline theme resolver in `BaseHead` —
it has to be blocking, because the alternative is one frame of the wrong theme.

**Progressive enhancement.** Reveal animations are scoped under `html.js`, so if scripts
never run, nothing is left stranded at `opacity: 0`.

**Overlays.** The mobile menu is a real `<dialog>` opened with `showModal()` — that buys
the top layer, a focus trap, Escape-to-close, an inert page behind, and `::backdrop`, none
of which is worth hand-rolling. Two traps to know about if you touch it: `display` must be
declared only on the `[open]` rule (an author `display` on the base selector beats the UA's
`dialog:not([open]) { display: none }`, leaving an invisible full-viewport element that
swallows every click on the page), and the `close` event is not reliably delivered, so the
scroll lock is released on the code path this site controls rather than from that event.

**Navigation.** `scripts/navigation-watchdog.ts` guards the view-transition router. A
transition that never reaches its update callback leaves the page permanently frozen with
input dead and no error logged, and Astro has no timeout of its own; this falls back to a
full page load instead.

**Social cards.** Every page and post gets its own Open Graph image, rendered during the
build by Satori and rasterised with resvg. `BaseHead` derives the image URL from the page's
own pathname, so the two ends stay in sync by construction.

**Markdown.** Sätteri, Astro's native pipeline. Heading anchors are a Sätteri hast plugin
rather than a rehype one, which keeps the unified pipeline out of the build entirely. Shiki
is configured with two themes and emits both palettes as custom properties, so code
highlighting is correct on first paint with no JavaScript.

**Motion.** The hero is a canvas particle field — a drifting node graph crossed by curving
tracks that excite the nodes they pass. It is not scheduled at all while off screen or while
the tab is hidden, and `prefers-reduced-motion` collapses every duration to zero and draws a
single composed frame.

**Print.** `/resume` has a real print stylesheet: chrome hidden, colour dropped, entries kept
off page breaks, and link destinations spelled out since a printed link can't be clicked.

## Deploying

`npm run build` produces a fully static `dist/`, deployable to GitHub Pages, Netlify,
Vercel, Cloudflare Pages, or any static host. Set `site` in `astro.config.mjs` to the final
URL first.
