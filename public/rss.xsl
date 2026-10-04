<?xml version="1.0" encoding="UTF-8"?>
<!--
  Opening an RSS URL in a browser normally shows raw XML. This stylesheet
  renders the feed as a readable page instead, with the subscribe URL spelled
  out for anyone who arrived by clicking rather than by subscribing.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> — RSS feed</title>
        <style>
          :root { color-scheme: light dark; --fg: #121d19; --mut: #5f6965; --hair: #e0e2dd; --bg: #fafaf6; --acc: #3c6511 }
          @media (prefers-color-scheme: dark) { :root { --fg: #f3f5ec; --mut: #a0afa7; --hair: #293530; --bg: #14201c; --acc: #c6f18a } }
          * { box-sizing: border-box }
          body { margin: 0; padding: 4rem 1.5rem; background: var(--bg); color: var(--fg);
                 font: 16px/1.65 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif }
          main { max-width: 42rem; margin: 0 auto }
          h1 { font-size: 1.9rem; letter-spacing: -0.02em; margin: 0 0 .4rem }
          .sub { color: var(--mut); margin: 0 0 2rem }
          .banner { padding: 1rem 1.1rem; border: 1px solid var(--hair); border-left: 2px solid var(--acc);
                    border-radius: 0 10px 10px 0; margin-bottom: 2.5rem; font-size: .92rem; color: var(--mut) }
          code { font-family: ui-monospace, Menlo, monospace; font-size: .86em; color: var(--fg) }
          article { padding: 1.4rem 0; border-top: 1px solid var(--hair) }
          h2 { font-size: 1.15rem; margin: 0 0 .3rem; letter-spacing: -0.01em }
          a { color: inherit; text-decoration-color: var(--hair) }
          a:hover { color: var(--acc) }
          time { font-family: ui-monospace, Menlo, monospace; font-size: .74rem; letter-spacing: .08em;
                 text-transform: uppercase; color: var(--mut) }
          p.desc { margin: .4rem 0 0; color: var(--mut); font-size: .94rem }
          footer { margin-top: 3rem; padding-top: 1.2rem; border-top: 1px solid var(--hair);
                   font-size: .85rem; color: var(--mut) }
        </style>
      </head>
      <body>
        <main>
          <h1><xsl:value-of select="/rss/channel/title" /></h1>
          <p class="sub"><xsl:value-of select="/rss/channel/description" /></p>

          <div class="banner">
            This is an RSS feed. Paste this page's URL into a feed reader to subscribe —
            new posts will show up there automatically.
          </div>

          <xsl:for-each select="/rss/channel/item">
            <article>
              <time><xsl:value-of select="substring(pubDate, 6, 11)" /></time>
              <h2><a href="{link}"><xsl:value-of select="title" /></a></h2>
              <p class="desc"><xsl:value-of select="description" /></p>
            </article>
          </xsl:for-each>

          <footer>
            <a href="{/rss/channel/link}">← Back to the site</a>
          </footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
