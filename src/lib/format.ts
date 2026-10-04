/** Shared formatters, so every date on the site is spelled the same way. */

const long = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/* en-US for the short form: en-GB abbreviates September to "Sept", which
   breaks the even three-letter column of role dates ("Aug", "Sep", "Oct"). */
const short = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (date: Date): string => long.format(date);
export const formatMonth = (date: Date): string => short.format(date);
/** `<time datetime>` wants an ISO date, not a locale string. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
