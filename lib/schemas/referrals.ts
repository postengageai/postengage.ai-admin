import { z } from 'zod';

export const ReferralStatusSchema = z.enum([
  'active',
  'inactive',
  'expired',
]);

export const ReferralSchema = z.object({
  _id: z.string(),
  referrer_id: z.string(),
  referral_code: z.string(),
  status: ReferralStatusSchema,
  credit_bonus_amount: z.number(),
  usage_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  expired_at: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type Referral = z.infer<typeof ReferralSchema>;

export const ReferralUsageSchema = z.object({
  _id: z.string(),
  referral_id: z.string(),
  referrer_id: z.string(),
  referred_user_id: z.string(),
  bonus_amount: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReferralUsage = z.infer<typeof ReferralUsageSchema>;

export const CreateReferralRequestSchema = z.object({
  referral_code: z.string().min(3, 'Referral code must be at least 3 characters'),
  credit_bonus_amount: z.number().min(0).default(2500),
  notes: z.string().optional(),
});

export type CreateReferralRequest = z.infer<typeof CreateReferralRequestSchema>;
