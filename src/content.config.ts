import { defineCollection, z } from "astro:content";

const characters = defineCollection({
  type: "content",
  schema: z.object({
    order: z.number().int().positive(),
    name: z.string(),
    role: z.string(),
    shortDescription: z.string(),
    tags: z.array(z.string()).min(1),
    heroImage: z.string(),
    galleryImages: z.array(z.string()).optional(),
    world: z.string().optional(),
    region: z.string().optional(),
    faction: z.string().optional(),
    featuredQuote: z.string().optional()
  })
});

export const collections = { characters };
