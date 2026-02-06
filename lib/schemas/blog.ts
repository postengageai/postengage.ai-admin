import { z } from 'zod';

export const BlogPostStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const BlogPostSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  status: BlogPostStatusSchema,
  author: z.string(), // User ID (ObjectId as string)
  published_at: z.string().nullable().optional(), // ISO date string
  created_at: z.string(), // ISO date string
  updated_at: z.string(), // ISO date string
  tags: z.array(z.string()).optional(),
  cover_image: z.string().optional().nullable(), // Media ID (ObjectId as string)
  seo: z.object({
    meta_title: z.string(),
    meta_description: z.string(),
    keywords: z.array(z.string()).optional(),
  }),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const CreateBlogPostRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  status: BlogPostStatusSchema.optional(),
  published_at: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  cover_image: z.string().optional().nullable(), // Media ID (ObjectId as string)
  seo: z.object({
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export type CreateBlogPostRequest = z.infer<typeof CreateBlogPostRequestSchema>;

export const UpdateBlogPostRequestSchema = CreateBlogPostRequestSchema.partial();

export type UpdateBlogPostRequest = z.infer<typeof UpdateBlogPostRequestSchema>;

export const BlogPostListResponseSchema = z.object({
  items: z.array(BlogPostSchema),
  total: z.number(),
});
