/**
 * Proposal Validation Schemas
 *
 * Zod schemas for validating Proposal request data
 */

import { z } from 'zod'

// ==================== Enums ====================

export const proposalStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
])

// ==================== Proposal Line Item Schema ====================

/**
 * Line item with pricing for proposal
 * Matches RFQ item structure with added pricing
 */
export const proposalLineItemSchema = z.object({
  rfqItemId: z.string().optional(), // Reference to original RFQ item
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().max(50, 'Unit too long').optional(),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  totalPrice: z.number().nonnegative('Total price must be non-negative').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// ==================== Proposal Create Schema ====================

export const createProposalSchema = z.object({
  rfqRequestId: z.string().min(1, 'RFQ ID is required'),
  lineItems: z.array(proposalLineItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().nonnegative('Subtotal must be non-negative').optional(),
  currency: z.string().max(10, 'Currency code too long').optional().default('USD'),
  attachments: z.array(z.string().max(500)).optional(), // Array of file URLs
  notes: z.string().max(2000, 'Notes too long').optional(),
  deliveryTerms: z.string().max(1000, 'Delivery terms too long').optional(),
  validity: z.number().int().positive('Validity must be a positive number of days').optional(),
  status: proposalStatusSchema.optional().default('DRAFT'),
})

// ==================== Proposal Update Schema (Supplier) ====================

export const updateProposalSchema = z.object({
  lineItems: z.array(proposalLineItemSchema).min(1, 'At least one line item is required').optional(),
  subtotal: z.number().nonnegative('Subtotal must be non-negative').optional(),
  currency: z.string().max(10, 'Currency code too long').optional(),
  attachments: z.array(z.string().max(500)).optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  deliveryTerms: z.string().max(1000, 'Delivery terms too long').optional(),
  validity: z.number().int().positive('Validity must be a positive number of days').optional(),
})

// ==================== Admin Update Schema ====================

export const adminUpdateProposalSchema = z.object({
  adminMargin: z.number().nonnegative('Admin margin must be non-negative').optional(),
  shippingCost: z.number().nonnegative('Shipping cost must be non-negative').optional(),
  taxPercentage: z.number().nonnegative('Tax percentage must be non-negative').max(100, 'Tax percentage cannot exceed 100').optional(),
  taxAmount: z.number().nonnegative('Tax amount must be non-negative').optional(),
  grandTotal: z.number().nonnegative('Grand total must be non-negative').optional(),
  termsConditions: z.string().max(5000, 'Terms and conditions too long').optional(),
  status: proposalStatusSchema.optional(),
  isShared: z.boolean().optional(),
  emailSentTo: z.array(z.string().email('Invalid email address')).optional(),
})

// ==================== Proposal Action Schema ====================

export const proposalActionSchema = z.object({
  action: z.enum(['submit', 'accept', 'reject', 'cancel', 'reopen', 'share', 'unshare']),
  emailRecipients: z.array(z.string().email('Invalid email address')).optional(),
})

// ==================== Proposal Query Schema ====================

export const proposalQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: proposalStatusSchema.optional(),
  rfqRequestId: z.string().optional(),
  supplierId: z.string().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'grandTotal', 'status', 'proposalNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ==================== Types ====================

export type CreateProposalInput = z.infer<typeof createProposalSchema>
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>
export type AdminUpdateProposalInput = z.infer<typeof adminUpdateProposalSchema>
export type ProposalActionInput = z.infer<typeof proposalActionSchema>
export type ProposalQueryInput = z.infer<typeof proposalQuerySchema>
export type ProposalLineItemInput = z.infer<typeof proposalLineItemSchema>

// ==================== Helper Types ====================

/**
 * Parsed proposal line item with calculated total
 */
export interface ProposalLineItem {
  rfqItemId?: string
  name: string
  description?: string
  quantity: number
  unit?: string
  unitPrice: number
  totalPrice: number
  notes?: string
}

/**
 * Parse and validate line items JSON
 */
export function parseLineItems(lineItemsJson: string | null): ProposalLineItem[] {
  if (!lineItemsJson) return []
  try {
    const parsed = JSON.parse(lineItemsJson)
    const result = z.array(proposalLineItemSchema).safeParse(parsed)
    if (result.success) {
      return result.data.map(item => ({
        ...item,
        totalPrice: item.totalPrice ?? item.quantity * item.unitPrice,
      }))
    }
    return []
  } catch {
    return []
  }
}

/**
 * Serialize line items to JSON
 */
export function serializeLineItems(lineItems: ProposalLineItem[]): string {
  return JSON.stringify(lineItems.map(item => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  })))
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(lineItems: ProposalLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice), 0)
}
