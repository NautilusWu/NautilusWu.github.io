import type { APIRoute } from 'astro';

/**
 * Generated rather than static so the sitemap URL always matches the
 * configured `site` — a hard-coded robots.txt is the classic thing that goes
 * stale the day the domain changes.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site ?? 'https://edwardwu.dev').href;

  /* `/og/` is deliberately NOT disallowed. Those are the Open Graph cards, and
     the crawlers that fetch them to build a link preview — Twitterbot, Slack,
     LinkedIn, Discord — respect robots.txt. Blocking the directory to keep the
     images out of image search would also stop every preview from rendering,
     which is the entire reason they exist. Keeping them out of an index is a
     job for an `X-Robots-Tag` response header, not for this file. */
  return new Response(['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
