import satori, { type SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { profile } from '../data/site';

/* Fonts are imported as data URIs rather than read off disk. `import.meta.url`
   would point at the bundled chunk inside `dist/.prerender`, not at `src`, so
   a filesystem read here breaks the moment Vite bundles this module. `?inline`
   makes the bytes part of the module graph, which is path-independent. */
import inter400 from '../assets/fonts/inter-latin-400-normal.woff?inline';
import inter500 from '../assets/fonts/inter-latin-500-normal.woff?inline';
import inter600 from '../assets/fonts/inter-latin-600-normal.woff?inline';
import mono400 from '../assets/fonts/jetbrains-mono-latin-400-normal.woff?inline';

/**
 * Build-time Open Graph card rendering.
 *
 * Satori takes a small subset of CSS (flexbox only — no grid, no floats, no
 * external images) plus real font buffers and returns SVG; resvg rasterises
 * that to PNG. Both run in the Node build, so no card is ever generated at
 * request time and there is no runtime dependency on either library.
 *
 * The `.woff` files in `src/assets/fonts` exist purely for this: Satori cannot
 * read the `woff2` files the browser gets, and these are never served.
 */

/* Satori takes an ArrayBuffer or a Node Buffer, so decode straight to Buffer. */
const decodeFont = (dataUri: string): Buffer =>
  Buffer.from(dataUri.slice(dataUri.indexOf(',') + 1), 'base64');

const WIDTH = 1200;
const HEIGHT = 630;

/* Decoded once per build rather than once per card — there is one card per
   page, and each family is ~25 kB of base64 to unpack. */
const FONTS: SatoriOptions['fonts'] = [
  { name: 'Inter', data: decodeFont(inter400), weight: 400, style: 'normal' },
  { name: 'Inter', data: decodeFont(inter500), weight: 500, style: 'normal' },
  { name: 'Inter', data: decodeFont(inter600), weight: 600, style: 'normal' },
  { name: 'JetBrains Mono', data: decodeFont(mono400), weight: 400, style: 'normal' },
];

/* The dark band every page opens with, so a shared link looks like the site.
   Duplicated as hex rather than imported from tokens.css: Satori has no CSS
   custom-property support and no `oklch()` parser. These are the `.band`
   values converted to sRGB — keep them in step with tokens.css. */
const COLOR = {
  band: '#101b17',
  fg: '#f3f5ec',
  fg2: '#becbc3',
  fg3: '#a0afa7',
  hair: '#293530',
  lime: '#c6f18a',
} as const;

export interface CardInput {
  /** The large display line. */
  title: string;
  /** Small mono label above the title — the section this page belongs to. */
  kind?: string;
  /** One line of supporting copy under the title. */
  subtitle?: string;
  /** Mono chips along the bottom edge. */
  tags?: readonly string[];
}

/** A Satori element tree. Plain objects, so this file needs no JSX pragma. */
type Node = {
  type: string;
  props: Record<string, unknown> & { children?: Node | Node[] | string };
};

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: Node | Node[] | string,
): Node => ({ type, props: { style, children } });

function card({ title, kind, subtitle, tags = [] }: CardInput): Node {
  // Long titles need to step down a size or they overflow the card.
  const titleSize = title.length > 74 ? 56 : title.length > 46 ? 66 : 78;

  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: COLOR.band,
      fontFamily: 'Inter',
    },
    [
      /* — Top row: section label, and the site's own mark — */
      el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        el(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'JetBrains Mono',
            fontSize: 21,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: COLOR.fg3,
          },
          kind ?? 'Portfolio',
        ),
        el(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58,
            // The header's monogram tile, inverted for the dark ground.
            borderRadius: 14,
            backgroundColor: COLOR.fg,
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            color: COLOR.band,
          },
          profile.name
            .split(' ')
            .map((part) => part[0])
            .join(''),
        ),
      ]),

      /* — Middle: the headline — */
      el('div', { display: 'flex', flexDirection: 'column' }, [
        // The lime mark the site's titles end with, as a bar Satori can draw.
        el('div', {
          display: 'flex',
          width: 64,
          height: 6,
          borderRadius: 3,
          backgroundColor: COLOR.lime,
          marginBottom: 30,
        }),
        el(
          'div',
          {
            display: 'flex',
            fontWeight: 600,
            fontSize: titleSize,
            lineHeight: 1.05,
            letterSpacing: '-0.045em',
            color: COLOR.fg,
            // Satori has no `text-wrap`, so cap the box and let it wrap.
            maxWidth: 940,
          },
          title,
        ),
        ...(subtitle
          ? [
              el(
                'div',
                {
                  display: 'flex',
                  marginTop: 22,
                  fontSize: 27,
                  lineHeight: 1.45,
                  color: COLOR.fg2,
                  maxWidth: 820,
                },
                subtitle,
              ),
            ]
          : []),
      ]),

      /* — Bottom: attribution rule, then tags — */
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', {
          display: 'flex',
          height: 1,
          width: '100%',
          backgroundColor: COLOR.hair,
          marginBottom: 26,
        }),
        el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
          el('div', { display: 'flex', alignItems: 'center' }, [
            el(
              'div',
              { display: 'flex', fontSize: 26, fontWeight: 600, color: COLOR.fg },
              profile.name,
            ),
            el('div', {
              display: 'flex',
              width: 5,
              height: 5,
              borderRadius: 5,
              backgroundColor: COLOR.lime,
              margin: '0 18px',
            }),
            el('div', { display: 'flex', fontSize: 24, color: COLOR.fg3 }, profile.affiliation),
          ]),
          el(
            'div',
            { display: 'flex', alignItems: 'center' },
            tags.slice(0, 3).map((tag) =>
              el(
                'div',
                {
                  display: 'flex',
                  marginLeft: 10,
                  // The site's square tags, not pills.
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: `1px solid ${COLOR.hair}`,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 19,
                  color: COLOR.fg2,
                },
                tag,
              ),
            ),
          ),
        ]),
      ]),
    ],
  );
}

export async function renderCard(input: CardInput): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(card(input) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: FONTS,
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();

  /* Copied out of the Buffer rather than handed over directly. Node allocates
     small Buffers from a shared pool, so the underlying ArrayBuffer can be
     larger than the PNG and shared with unrelated data — not something to pass
     to a web API. The copy also gives the exact type `Blob` wants. */
  const bytes = new Uint8Array(png.byteLength);
  bytes.set(png);
  return bytes;
}
