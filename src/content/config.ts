import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date().optional(),
  publishDate: z.coerce.date().optional(),
  date: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  image: z.string().optional(),
  author: z.string().optional(),
  authors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional().default(false),
  draft: z.boolean().optional().default(false),
  order: z.number().optional(),
  series: z.string().optional(),
  lastUpdated: z.coerce.date().optional(),
}).transform((data) => ({
  ...data,
  date: data.pubDate ?? data.publishDate ?? data.date ?? new Date(0),
  cover: data.heroImage ?? data.image ?? null,
  byline: data.author ?? data.authors?.join(', ') ?? 'ContentFlow Team',
}));

const contentCollection = defineCollection({ type: 'content', schema: baseSchema });

export const collections = {
  blog: contentCollection,
  docs: contentCollection,
  'ai-agents': contentCollection,
  platform: contentCollection,
  'seo-strategy': contentCollection,
  'startup-journey': contentCollection,
  'technical-optimization': contentCollection,
  tutorials: contentCollection,
};
