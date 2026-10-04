import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard, type CardInput } from '../../lib/og-card';
import { pages, profile } from '../../data/site';

/**
 * One Open Graph card per page, all generated during the build.
 *
 * The route enumerates pages itself, so adding a post adds its social card
 * with no further work — and `BaseHead.astro` derives the image URL from the
 * page's own pathname, which keeps the two ends in sync by construction.
 */
export const getStaticPaths = (async () => {
  const posts = await getCollection('writing', ({ data }) => !data.draft);

  const cards: Array<{ route: string; card: CardInput }> = [
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
      route: 'experience',
      card: {
        kind: 'Experience',
        title: pages.experience.title,
        subtitle: pages.experience.lede,
        tags: ['Professional', 'Teaching', 'Leadership'],
      },
    },
    {
      route: 'writing',
      card: {
        kind: 'Writing',
        title: pages.writing.title,
        subtitle: pages.writing.description,
        tags: pages.writing.topics,
      },
    },
    {
      route: 'resume',
      card: {
        kind: 'Resume',
        title: profile.name,
        subtitle: `${profile.discipline.join(' · ')} — ${profile.affiliation}`,
        tags: ['Education', 'Experience', 'Honours'],
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

  return cards.map(({ route, card }) => ({ params: { route }, props: { card } }));
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
