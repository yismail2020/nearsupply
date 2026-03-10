/**
 * RFQ Validation Schemas
 *
 * Zod schemas for validating RFQ request data
 */

import { z } from 'zod'

// ==================== Enums ====================

export const rfqStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'QUOTES_RECEIVED',
  'UNDER_REVIEW',
  'COMPLETED',
  'CANCELLED',
])

export const rfqRequestTypeSchema = z.enum(['PRODUCT', 'SERVICE'])

// ==================== Line Item Schema ====================

export const rfqLineItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().max(50, 'Unit too long').optional(),
  specifications: z.string().max(2000, 'Specifications too long').optional(),
  link: z.string().url('Invalid URL').max(500, 'Link too long').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').max(500, 'Image URL too long').optional().or(z.literal('')),
  sortOrder: z.number().int().optional(),
})

export const rfqLineItemArraySchema = z.array(rfqLineItemSchema).min(1, 'At least one line item is required')

// ==================== RFQ Create Schema ====================

export const createRFQSchema = z.object({
  requestType: rfqRequestTypeSchema.optional().default('PRODUCT'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  budget: z.number().nonnegative('Budget must be non-negative').optional(),
  currency: z.string().max(10, 'Currency code too long').optional().default('USD'),
  deadlineDate: z.string().datetime('Invalid deadline date').optional().nullable(),
  deliveryDate: z.string().datetime('Invalid delivery date').optional().nullable(),
  deliveryTerms: z.string().max(1000, 'Delivery terms too long').optional(),
  deliveryAddress: z.string().max(500, 'Delivery address too long').optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  internalNotes: z.string().max(2000, 'Internal notes too long').optional(),
  attachments: z.array(z.string().max(500)).optional(), // Array of file URLs
  lineItems: rfqLineItemArraySchema,
})

// ==================== RFQ Update Schema ====================

export const updateRFQSchema = z.object({
  requestType: rfqRequestTypeSchema.optional(),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  budget: z.number().nonnegative('Budget must be non-negative').optional(),
  currency: z.string().max(10, 'Currency code too long').optional(),
  deadlineDate: z.string().datetime('Invalid deadline date').optional().nullable(),
  deliveryDate: z.string().datetime('Invalid delivery date').optional().nullable(),
  deliveryTerms: z.string().max(1000, 'Delivery terms too long').optional(),
  deliveryAddress: z.string().max(500, 'Delivery address too long').optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  internalNotes: z.string().max(2000, 'Internal notes too long').optional(),
  attachments: z.array(z.string().max(500)).optional(),
  lineItems: rfqLineItemArraySchema.optional(),
})

// ==================== RFQ Action Schema ====================

export const rfqActionSchema = z.object({
  action: z.enum(['submit', 'cancel', 'reopen']),
})

// ==================== RFQ Query Schema ====================

export const rfqQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: rfqStatusSchema.optional(),
  category: z.string().max(100).optional(),
  search: z.string().max(255).optional(),
  clientId: z.string().cuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'deadlineDate', 'title', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ==================== Types ====================

export type CreateRFQInput = z.infer<typeof createRFQSchema>
export type UpdateRFQInput = z.infer<typeof updateRFQSchema>
export type RFQActionInput = z.infer<typeof rfqActionSchema>
export type RFQQueryInput = z.infer<typeof rfqQuerySchema>
export type RFQLineItemInput = z.infer<typeof rfqLineItemSchema>
