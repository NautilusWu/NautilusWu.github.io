import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { pages, profile, contact } from '../data/site';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  return rss({
    title: `${profile.name} — Writing`,
    description: pages.writing.description,
    site: context.site ?? 'https://edwardwu.dev',
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/writing/${post.id}`,
      categories: [...post.data.tags],
      author: `${contact.email} (${profile.name})`,
    })),
    // Styles the raw feed for anyone who opens it in a browser.
    stylesheet: '/rss.xsl',
    customData: `<language>en-us</language><managingEditor>${contact.email} (${profile.name})</managingEditor>`,
  });
};
