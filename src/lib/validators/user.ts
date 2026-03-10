/**
 * User Validation Schemas
 *
 * Zod schemas for validating User request data
 */

import { z } from 'zod'

// ==================== Enums ====================

export const userRoleSchema = z.enum(['ADMIN', 'SUPPLIER', 'CLIENT'])

// ==================== User Update Schema (Admin) ====================

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email too long').optional(),
  role: userRoleSchema.optional(),
  company: z.string().max(200, 'Company name too long').optional().nullable(),
  phone: z.string().max(50, 'Phone too long').optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').max(500, 'Avatar URL too long').optional().nullable(),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  isActive: z.boolean().optional(),
})

// ==================== User Query Schema ====================

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  role: userRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email', 'role']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ==================== Profile Update Schema ====================

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  company: z.string().max(200, 'Company name too long').optional().nullable(),
  phone: z.string().max(50, 'Phone too long').optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').max(500, 'Avatar URL too long').optional().nullable().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional().nullable(),
})

// ==================== Password Change Schema ====================

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100, 'Password too long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ==================== Admin Create User Schema ====================

export const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: userRoleSchema.optional().default('CLIENT'),
  company: z.string().max(200, 'Company name too long').optional().nullable(),
  phone: z.string().max(50, 'Phone too long').optional().nullable(),
  avatar: z.string().url('Invalid avatar URL').max(500, 'Avatar URL too long').optional().nullable(),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

// ==================== Types ====================

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
