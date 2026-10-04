import { readdirSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
// `z` re-exported from `astro:content` / `astro:schema` is deprecated in
// Astro 7 and goes away in 8; `astro/zod` is the supported path.
import { z } from 'astro/zod';

const WRITING_DIR = './src/content/writing';
const posts = glob({ base: WRITING_DIR, pattern: '**/*.{md,mdx}' });

/**
 * Astro's `glob` loader, plus one fix. When the folder holds no posts, `glob`
 * returns before it prunes entries cached by earlier builds (in
 * `node_modules/.astro/data-store.json`), so deleting your last post left it
 * cached and still published. Clearing the cache in exactly that case makes
 * an empty folder mean an empty blog.
 */
const writingLoader: Loader = {
  name: 'writing',
  async load(context) {
    const hasPosts = readdirSync(WRITING_DIR, { recursive: true }).some((file) =>
      /\.mdx?$/.test(String(file)),
    );
    if (!hasPosts) context.store.clear();
    await posts.load(context);
  },
};

/**
 * The `writing` collection — the personal blog. Frontmatter is validated by
 * Zod at build time, so a post with a missing date or a malformed tag list
 * fails the build rather than rendering a broken card.
 */
const writing = defineCollection({
  loader: writingLoader,
  schema: z.object({
    title: z.string().max(90),
    /** Shown on the post list and used as the meta description. */
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Topics, e.g. those in `pages.writing.topics` in site.ts. */
    tags: z.array(z.string()).default([]),
    /** Hide from the index and the feed without deleting the file. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
