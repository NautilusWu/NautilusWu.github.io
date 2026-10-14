# edwardwu.dev

A static personal / academic site built with [Astro](https://astro.build). **No framework
runtime ships to the browser** — every page is HTML, shared styles, and a handful of small
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

The site has four pages: **Home** (the overview — who you are, recent experience, what
you work on, interests), **Experience** (professional, teaching, and leadership roles),
**Writing** (a personal blog), and **Resume** (an overview plus the PDF).

**All content lives in [`src/data/site.ts`](src/data/site.ts).** Pages read from these
typed exports; only section headings are written in the pages themselves.

| Export             | Used by                                                      |
| ------------------ | ------------------------------------------------------------ |
| `profile`          | home hero and bio, page titles, SEO description, Resume      |
| `contact`          | mail links, Resume PDF download                              |
| `socials`          | footer, JSON-LD                                              |
| `nav`              | top bar, mobile menu, footer                                 |
| `pages`            | Experience and Writing headers, and their link-preview cards |
| `focus`            | "Three ways I think" on the home page                        |
| `experience`       | Experience, the home page's recent roles, Resume             |
| `experienceGroups` | the sections of Experience, in order                         |
| `education`        | Resume, the home page's affiliation strip                    |
| `skills`           | "Methods and tools" on Experience                            |
| `awards`           | Resume                                                       |
| `interests`        | "Away from the keyboard" on the home page                    |
| `now`              | the dated "Now" card on the home page                        |

**Adding a role:** add an object to `experience` with `kind` (`professional`, `teaching`,
or `leadership`), `role`, `org`, `location`, `start` and `end` as `YYYY-MM` (leave `end`
empty for a current role), and `bullets`. Order in the file does not matter; every page
sorts newest first and formats the dates.

**Writing a post:** add a `.md` or `.mdx` file to
[`src/content/writing/`](src/content/writing/). Its file name becomes the URL. The
frontmatter is validated by Zod in [`src/content.config.ts`](src/content.config.ts):

```mdx
---
title: A title of up to 90 characters
description: One or two sentences for the post list, link previews, and RSS.
pubDate: 2026-10-15
tags: ['Family education']
---

Write freely here.
```

The Writing page, the home page, the RSS feed, the sitemap, and the link-preview card all
pick it up automatically. Tag posts with the topics listed in `pages.writing.topics`, and
set `draft: true` to hide a post without deleting it.

### Before you publish

1. `contact.email` and the `socials[].href` handles in `src/data/site.ts`.
2. `site` in [`astro.config.mjs`](astro.config.mjs) — it drives canonical URLs, the
   sitemap, the RSS feed, and Open Graph image URLs.
3. Drop your resume at `public/edward-wu-resume.pdf`. The download button only renders
   when that file actually exists. Without it, `/resume` shows only an email link for
   requesting the full resume.
4. `education[].gpa` — fill it in or leave it empty to omit the line.

## Structure

```
src/
  data/site.ts              all site content, typed
  content/writing/*.mdx     blog posts (Zod-validated frontmatter)
  content.config.ts         collection schema
  layouts/BaseLayout.astro  document shell
  components/               BaseHead, Header, Footer, PageHeader, Section, Entry, …
  scripts/                  one small client module per interaction
  lib/                      build-time helpers (experience sorting, OG cards, SEO, dates)
  pages/
    index, experience, resume, 404
    writing/                index + [...slug]
    og/[...route].png.ts    build-time Open Graph cards
    rss.xml.ts, robots.txt.ts, manifest.webmanifest.ts
  styles/
    global.css              entry point; imports the styles below
    tokens.css              custom properties only
    base.css                element defaults, page ground
    layout.css              shell, page bands, section headings, grids
    components.css          shared UI pieces
    prose.css               article typography, TOC
    portfolio.css           home-only pieces: hero, about + Now, focus, contact
    print.css               printed pages
```

## Engineering notes

**Fonts.** Inter supplies body text and the bold display typography; JetBrains Mono handles
small labels and code. The shared `--face-display` token points to `--font-sans`. Font families
are configured through Astro's pipeline against locally installed `@fontsource-variable`
packages; the build-time social cards use static `.woff` copies of Inter and JetBrains Mono
from `src/assets/fonts`, because Satori cannot read `woff2`. The build never contacts a font CDN,
and Astro generates metric-matched fallbacks to reduce layout shift while a webface loads.
Every subset is declared behind its own `unicode-range`, so a page downloads only the subsets
its text uses. Critical Latin faces are preloaded using `lib/fonts.ts`, because the `npm`
provider ignores `subsets` and
`<Font preload>` would preload every subset (~220 kB for Inter alone).

**Client JavaScript.** One module per concern in `src/scripts/`, all bound through
`onReady()`, which binds each module once per page — as soon as the DOM is ready on a cold
load, and on `astro:page-load` after a navigation — and tears it down before the next swap.
The only blocking script on the page is the inline theme resolver in `BaseHead` — it has to
be blocking, because the alternative is one frame of the wrong theme.

**Progressive enhancement.** Reveal animations are scoped under `html.js`, so if scripts
never run, nothing is left stranded at `opacity: 0`. Mobile navigation links remain visible
until the drawer handlers are ready.

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

**Markdown.** Posts use Astro's native Sätteri pipeline. `scripts/prose.ts` adds heading
permalinks after Astro has assigned IDs, wraps wide tables, and provides code-copy buttons
with accessible status messages and a selection fallback. Shiki emits both light and dark
palettes as custom properties, so code highlighting is correct on first paint.

**One design across pages.** Every page opens with the same dark band — the home hero is a
taller version of `PageHeader.astro`, passed to `BaseLayout`'s `hero` slot so it runs edge to
edge — and every section uses `Section.astro`: a mono `01 / LABEL` kicker over a bold title.
The band is dark in both themes because `.band` re-declares the dark colour tokens (see
`tokens.css`), so buttons, tags, and notes inside it adapt without special cases. Theme
colours live in tokens only; components never hard-code a hex value that should change with
the theme.

**Motion.** The hero is type only. Scroll reveals and interface transitions respect
`prefers-reduced-motion`.

**Print.** Every page has a print stylesheet: chrome hidden, colour dropped, entries kept off
page breaks, and link destinations spelled out since a printed link can't be clicked. A
printed `/resume` includes the contact email. Adding the resume PDF enables the download
action.

## Deploying

`npm run build` produces a fully static `dist/`, deployable to GitHub Pages, Netlify,
Vercel, Cloudflare Pages, or any static host. Set `site` in `astro.config.mjs` to the final
URL first.
