/**
 * Helper Utilities
 *
 * Common helper functions for the application
 */

import { db } from '../db'

// ==================== Number Generation ====================

/**
 * Generate a unique RFQ request number
 * Format: RFQ-YYYY-NNNNN (e.g., RFQ-2024-00001)
 */
export async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)

  const count = await db.rFQRequest.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
  })

  const sequence = (count + 1).toString().padStart(5, '0')
  return `RFQ-${year}-${sequence}`
}

/**
 * Generate a unique proposal number
 * Format: PROP-YYYY-NNNNN (e.g., PROP-2024-00001)
 */
export async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)

  const count = await db.proposal.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
  })

  const sequence = (count + 1).toString().padStart(5, '0')
  return `PROP-${year}-${sequence}`
}

/**
 * Generate a unique product SKU
 * Format: PRD-NNNNN (e.g., PRD-00001)
 */
export async function generateProductSku(): Promise<string> {
  const count = await db.product.count()
  const sequence = (count + 1).toString().padStart(5, '0')
  return `PRD-${sequence}`
}

// ==================== RFQ Categories ====================

export const RFQ_CATEGORIES = [
  { value: 'it_equipment', label: 'IT Equipment' },
  { value: 'office_furniture', label: 'Office Furniture' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'software', label: 'Software & Licenses' },
  { value: 'it_services', label: 'IT Services' },
  { value: 'consulting', label: 'Consulting Services' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'logistics', label: 'Logistics & Transportation' },
  { value: 'manufacturing', label: 'Manufacturing & Production' },
  { value: 'construction', label: 'Construction & Renovation' },
  { value: 'cleaning', label: 'Cleaning & Maintenance' },
  { value: 'catering', label: 'Catering & Food Services' },
  { value: 'security', label: 'Security Services' },
  { value: 'hr_services', label: 'HR & Recruitment' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'other', label: 'Other' },
] as const

export type RFQCategory = (typeof RFQ_CATEGORIES)[number]['value']

export function getCategoryLabel(value: string): string {
  return RFQ_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

// ==================== Currencies ====================

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { value: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
  { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'KRW', label: 'South Korean Won', symbol: '₩' },
  { value: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { value: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
] as const

export type Currency = (typeof CURRENCIES)[number]['value']

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol ?? currency
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ==================== Units ====================

export const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'units', label: 'Units' },
  { value: 'sets', label: 'Sets' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'lb', label: 'Pounds' },
  { value: 'oz', label: 'Ounces' },
  { value: 'm', label: 'Meters' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'mm', label: 'Millimeters' },
  { value: 'ft', label: 'Feet' },
  { value: 'in', label: 'Inches' },
  { value: 'm2', label: 'Square Meters' },
  { value: 'ft2', label: 'Square Feet' },
  { value: 'm3', label: 'Cubic Meters' },
  { value: 'l', label: 'Liters' },
  { value: 'gal', label: 'Gallons' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
  { value: 'lot', label: 'Lot' },
  { value: 'batch', label: 'Batch' },
  { value: 'project', label: 'Project' },
  { value: 'service', label: 'Service' },
] as const

export type Unit = (typeof UNITS)[number]['value']

export function getUnitLabel(value: string): string {
  return UNITS.find((u) => u.value === value)?.label ?? value
}

// ==================== Status Labels ====================

export const RFQ_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  QUOTES_RECEIVED: 'Quotes Received',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  SUPPLIER: 'Supplier',
  CLIENT: 'Client',
}

// ==================== Date Utilities ====================

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string | null): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date | string | null): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  return d > new Date()
}

// ==================== String Utilities ====================

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ==================== Calculation Utilities ====================

/**
 * Calculate proposal totals
 */
export function calculateProposalTotals(params: {
  subtotal: number
  adminMargin?: number
  shippingCost?: number
  taxPercentage?: number
}): {
  taxAmount: number
  grandTotal: number
} {
  const { subtotal, adminMargin = 0, shippingCost = 0, taxPercentage = 0 } = params

  const taxAmount = (subtotal + shippingCost) * (taxPercentage / 100)
  const grandTotal = subtotal + adminMargin + shippingCost + taxAmount

  return {
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  }
}
