import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard, type CardInput } from '../../lib/og-card';
import { profile, focus, skills } from '../../data/site';

/**
 * One Open Graph card per page, all generated during the build.
 *
 * The route enumerates pages itself, so adding a post adds its social card
 * with no further work — and `BaseHead.astro` derives the image URL from the
 * page's own pathname, which keeps the two ends in sync by construction.
 */
export const getStaticPaths = (async () => {
  const posts = await getCollection('writing', ({ data }) => !data.draft);

  const pages: Array<{ route: string; card: CardInput }> = [
    {
      route: 'home',
      card: {
        kind: 'Portfolio',
        title: profile.name,
        subtitle: profile.description,
        tags: profile.discipline,
      },
    },
    {
      route: 'research',
      card: {
        kind: 'Research',
        title: 'Measuring things carefully, then computing with them',
        subtitle: 'Detector simulation, test-beam analysis, and the tooling around both.',
        tags: focus[0].tags,
      },
    },
    {
      route: 'projects',
      card: {
        kind: 'Projects',
        title: 'Things I built to understand something',
        subtitle: 'Inference profiling, detector analysis tooling, and this website.',
        tags: skills[2].items.slice(0, 3),
      },
    },
    {
      route: 'writing',
      card: {
        kind: 'Writing',
        title: 'Notes from the middle of the problem',
        subtitle: 'What I measured, what surprised me, and what I would do differently.',
        tags: ['Physics', 'ML Systems', 'Web'],
      },
    },
    {
      route: 'resume',
      card: {
        kind: 'Curriculum Vitae',
        title: profile.name,
        subtitle: `${profile.discipline.join(' · ')} — ${profile.affiliation}`,
        tags: ['Education', 'Research', 'Projects'],
      },
    },
    {
      route: 'about',
      card: {
        kind: 'About',
        title: 'Curiosity first, rigour right behind it',
        subtitle: 'How I got here, what I am working on now, and how to get in touch.',
        tags: ['Bio', 'Now', 'Contact'],
      },
    },
    ...posts.map((post) => ({
      route: `writing/${post.id}`,
      card: {
        kind: 'Writing',
        title: post.data.title,
        subtitle: post.data.description,
        tags: post.data.tags,
      } satisfies CardInput,
    })),
  ];

  return pages.map(({ route, card }) => ({ params: { route }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: CardInput }> = async ({ props }) => {
  const png = await renderCard(props.card);

  // Wrapped in a Blob because a raw Buffer is not a `BodyInit`.
  return new Response(new Blob([png], { type: 'image/png' }), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
