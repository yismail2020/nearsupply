/**
 * Product Validation Schemas
 *
 * Zod schemas for validating Product request data
 */

import { z } from 'zod'

// ==================== Enums ====================

export const productStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
])

// ==================== Product Categories ====================

export const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'office_equipment', label: 'Office Equipment' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'software', label: 'Software & Licenses' },
  { value: 'it_services', label: 'IT Services' },
  { value: 'consulting', label: 'Consulting Services' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'logistics', label: 'Logistics & Transportation' },
  { value: 'manufacturing', label: 'Manufacturing & Production' },
  { value: 'cleaning', label: 'Cleaning & Maintenance' },
  { value: 'catering', label: 'Catering & Food Services' },
  { value: 'security', label: 'Security Services' },
  { value: 'hr_services', label: 'HR & Recruitment' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'other', label: 'Other' },
] as const

// ==================== Product Create Schema ====================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  currency: z.string().max(10, 'Currency code too long').optional().default('USD'),
  minimumOrderQuantity: z.number().positive('Minimum order quantity must be positive').optional(),
  unit: z.string().max(50, 'Unit too long').optional(),
  isFeatured: z.boolean().optional().default(false),
  status: productStatusSchema.optional().default('ACTIVE'),
})

// ==================== Product Update Schema ====================

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  sku: z.string().max(100, 'SKU too long').optional(),
  unitPrice: z.number().nonnegative('Unit price must be non-negative').optional(),
  currency: z.string().max(10, 'Currency code too long').optional(),
  minimumOrderQuantity: z.number().positive('Minimum order quantity must be positive').optional().nullable(),
  unit: z.string().max(50, 'Unit too long').optional(),
  isFeatured: z.boolean().optional(),
  status: productStatusSchema.optional(),
})

// ==================== Product Query Schema ====================

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: productStatusSchema.optional(),
  category: z.string().max(100).optional(),
  supplierId: z.string().optional(),
  search: z.string().max(255).optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'unitPrice', 'category', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ==================== Types ====================

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductQueryInput = z.infer<typeof productQuerySchema>
