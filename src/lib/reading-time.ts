/**
 * Reading time, computed from a collection entry's raw body.
 *
 * Deliberately not a Markdown plugin: the writing index needs this for every
 * post, and rendering all of them just to count words would be an absurd
 * amount of work for one number. 220 wpm is a reasonable pace for prose with
 * code in it.
 */
const WORDS_PER_MINUTE = 220;

export interface ReadingStats {
  minutes: number;
  words: number;
}

export function readingStats(body = ''): ReadingStats {
  const prose = body
    // Fenced code is skimmed, not read — don't bill it at prose speed.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    // Strip frontmatter-ish leftovers, link URLs, and MDX expressions.
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>|~-]/g, ' ');

  const words = prose.split(/\s+/u).filter(Boolean).length;

  return { words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}
