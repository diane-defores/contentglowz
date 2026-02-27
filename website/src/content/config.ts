import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Accept pubDate, publishDate, or date (normalize at render time)
    pubDate: z.coerce.date().optional(),
    publishDate: z.coerce.date().optional(),
    date: z.coerce.date().optional(),
    // Accept both heroImage and image
    heroImage: z.string().optional(),
    image: z.string().optional(),
    // Author: string or array
    author: z.string().optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
  }).transform((data) => ({
    ...data,
    // Normalize date: prefer pubDate → publishDate → date → epoch
    date: data.pubDate ?? data.publishDate ?? data.date ?? new Date(0),
    // Normalize image: prefer heroImage, fall back to image
    cover: data.heroImage ?? data.image ?? null,
    // Normalize author
    byline: data.author ?? data.authors?.join(', ') ?? 'My Robots Team',
  })),
});

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  blog,
  docs,
};
