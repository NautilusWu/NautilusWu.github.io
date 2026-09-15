import { profile, contact, socials } from '../data/site';

/**
 * Turns a page path into the route of its build-time Open Graph image.
 * `/writing/foo/` → `writing/foo`, `/` → `home`.
 */
export function ogRouteFor(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return clean === '' ? 'home' : clean;
}

/** JSON-LD `Person`, emitted once on every page. */
export function personSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: siteUrl,
    email: `mailto:${contact.email}`,
    jobTitle: 'Undergraduate Researcher',
    description: profile.description,
    knowsAbout: [...profile.discipline],
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: profile.affiliation,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ann Arbor',
      addressRegion: 'MI',
      addressCountry: 'US',
    },
    sameAs: socials
      .filter((social) => !social.href.startsWith('mailto:'))
      .map((social) => social.href),
  };
}

/** JSON-LD `BlogPosting`, emitted on writing pages. */
export function articleSchema(input: {
  title: string;
  description: string;
  url: string;
  image: string;
  published: Date;
  updated?: Date;
  tags: readonly string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.image,
    datePublished: input.published.toISOString(),
    dateModified: (input.updated ?? input.published).toISOString(),
    keywords: input.tags.join(', '),
    author: { '@type': 'Person', name: profile.name },
    publisher: { '@type': 'Person', name: profile.name },
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
  };
}
