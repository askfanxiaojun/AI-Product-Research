import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const reports = defineCollection({loader: glob({pattern: '**/reports/*.md', base: './content/products'}), schema: z.object({
  title: z.string().min(1), product: z.string().min(1), productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  website: z.string().url(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), category: z.string().min(1),
  summary: z.string().min(1), tags: z.array(z.string()).default([]), sources: z.array(z.string().url()).min(1)
})});
export const collections = {reports};
