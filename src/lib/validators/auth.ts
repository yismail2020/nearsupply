/**
 * Authentication Validators
 *
 * Zod schemas for authentication-related validation
 */

import { z } from 'zod'

// ==================== Common Validators ====================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((email) => email.toLowerCase().trim())

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters')

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .transform((name) => name.trim())
  .optional()

const companySchema = z
  .string()
  .max(100, 'Company name must be less than 100 characters')
  .transform((company) => company?.trim())
  .optional()

const phoneSchema = z
  .string()
  .max(20, 'Phone number must be less than 20 characters')
  .optional()

const addressSchema = z
  .string()
  .max(500, 'Address must be less than 500 characters')
  .optional()

// ==================== Login Schema ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ==================== Register Schema ====================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  name: nameSchema,
  company: companySchema,
  phone: phoneSchema,
  role: z.enum(['CLIENT', 'SUPPLIER']).default('CLIENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

// ==================== Profile Update Schema ====================

export const profileUpdateSchema = z.object({
  name: nameSchema,
  company: companySchema,
  phone: phoneSchema,
  address: addressSchema,
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// ==================== Password Change Schema ====================

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

// ==================== Password Reset Request Schema ====================

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

// ==================== Password Reset Schema ====================

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type PasswordResetInput = z.infer<typeof passwordResetSchema>

// ==================== Validation Helper ====================

/**
 * Validate input data against a schema
 * Returns either success with data or error with messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return { success: false, errors }
}
