import { z } from 'zod';

export const MediaSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  mime_type: z.string(),
  size_bytes: z.number(),
  url: z.string().url(),
  status: z.enum(['active', 'archived', 'deleted']),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type Media = z.infer<typeof MediaSchema>;

export const UploadMediaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export type UploadMediaRequest = z.infer<typeof UploadMediaSchema>;

export const UpdateMediaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

export type UpdateMediaRequest = z.infer<typeof UpdateMediaSchema>;
