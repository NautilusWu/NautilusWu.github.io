import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from `astro:content` / `astro:schema` is deprecated in
// Astro 7 and goes away in 8; `astro/zod` is the supported path.
import { z } from 'astro/zod';

/**
 * The `writing` collection. Frontmatter is validated by Zod at build time, so a
 * post with a missing date or a malformed tag list fails the build rather than
 * rendering a broken card.
 */
const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().max(90),
    /** Shown on the index card and used as the meta description. */
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Hide from the index and the feed without deleting the file. */
    draft: z.boolean().default(false),
    /** Promote to the top of the writing index. */
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing };
