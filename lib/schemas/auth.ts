import { z } from 'zod';

// User schema matching backend response
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  phone: z.string().nullable(),
  avatar: z
    .object({
      id: z.string(),
      name: z.string(),
      url: z.string().url(),
      mime_type: z.string(),
      size: z.number(),
      tags: z.array(z.string()),
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    })
    .nullable(),
  is_verified: z.boolean(),
  status: z.string(),
  timezone: z.string().nullable(),
  language: z.string(),
  role: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Login request schema
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Signup request schema
export const SignupRequestSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

// Signup response schema
export const SignupResponseSchema = z.object({
  user: UserSchema,
  message: z.string(),
  verification_token: z.string().optional(), // Only in dev/test
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// Login response schema
export const LoginResponseSchema = z.object({
  user: UserSchema,
  message: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Verify email request schema
export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

// Verify email response schema
export const VerifyEmailResponseSchema = z.object({
  message: z.string(),
  user: UserSchema,
});

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;

// Resend verification request schema
export const ResendVerificationRequestSchema = z.object({
  email: z.string().email(),
});

export type ResendVerificationRequest = z.infer<
  typeof ResendVerificationRequestSchema
>;

// Forgot password request schema
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

// Reset password request schema
export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// Auth session state
export const AuthSessionSchema = z.object({
  user: UserSchema.nullable(),
  isAuthenticated: z.boolean(),
  isLoading: z.boolean(),
  lastActivity: z.number().optional(), // timestamp
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

// Auth actions
export const AuthActionsSchema = z.object({
  login: z.function().args(LoginRequestSchema).returns(z.promise(z.void())),
  signup: z.function().args(SignupRequestSchema).returns(z.promise(z.void())),
  logout: z.function().args().returns(z.promise(z.void())),
  verifyEmail: z
    .function()
    .args(VerifyEmailRequestSchema)
    .returns(z.promise(z.void())),
  resendVerification: z
    .function()
    .args(ResendVerificationRequestSchema)
    .returns(z.promise(z.void())),
  forgotPassword: z
    .function()
    .args(ForgotPasswordRequestSchema)
    .returns(z.promise(z.void())),
  resetPassword: z
    .function()
    .args(ResetPasswordRequestSchema)
    .returns(z.promise(z.void())),
  refreshSession: z.function().args().returns(z.promise(z.void())),
});

export type AuthActions = z.infer<typeof AuthActionsSchema>;
