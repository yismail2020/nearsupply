/**
 * Proposal API Client
 *
 * Client-side API functions for Proposal operations
 */

import type {
  Proposal,
  ProposalDetail,
  ProposalFormData,
  ProposalQueryParams,
  ProposalListResponse,
  ProposalResponse,
  ProposalCreateResponse,
  ProposalLineItem,
  AdminProposalFormData,
} from '@/types/proposal'

// ==================== Helper ====================

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred')
  }

  return data
}

// ==================== Query Params Builder ====================

function buildQueryString(params: ProposalQueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.status) searchParams.set('status', params.status)
  if (params.rfqRequestId) searchParams.set('rfqRequestId', params.rfqRequestId)
  if (params.supplierId) searchParams.set('supplierId', params.supplierId)
  if (params.search) searchParams.set('search', params.search)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ==================== API Functions ====================

/**
 * Get list of proposals
 */
export async function getProposals(params: ProposalQueryParams = {}): Promise<ProposalListResponse> {
  const queryString = buildQueryString(params)
  const response = await fetch(`/api/proposals${queryString}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<ProposalListResponse>(response)
}

/**
 * Get single proposal by ID
 */
export async function getProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Create new proposal
 */
export async function createProposal(data: ProposalFormData): Promise<ProposalCreateResponse> {
  const response = await fetch('/api/proposals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      rfqRequestId: data.rfqRequestId,
      lineItems: data.lineItems,
      subtotal: data.subtotal,
      currency: data.currency,
      attachments: data.attachments.length > 0 ? data.attachments : undefined,
      notes: data.notes || undefined,
      deliveryTerms: data.deliveryTerms || undefined,
      validity: data.validity ? parseInt(data.validity) : undefined,
    }),
  })

  return handleResponse<ProposalCreateResponse>(response)
}

/**
 * Update proposal (supplier)
 */
export async function updateProposal(id: string, data: Partial<ProposalFormData>): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      lineItems: data.lineItems,
      subtotal: data.subtotal,
      currency: data.currency,
      attachments: data.attachments,
      notes: data.notes,
      deliveryTerms: data.deliveryTerms,
      validity: data.validity ? parseInt(data.validity) : undefined,
    }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Update proposal (admin - commercial fields)
 */
export async function updateProposalAdmin(id: string, data: AdminProposalFormData): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      adminMargin: data.adminMargin ? parseFloat(data.adminMargin) : undefined,
      shippingCost: data.shippingCost ? parseFloat(data.shippingCost) : undefined,
      taxPercentage: data.taxPercentage ? parseFloat(data.taxPercentage) : undefined,
      termsConditions: data.termsConditions,
      status: data.status,
      isShared: data.isShared,
      emailSentTo: data.emailSentTo,
    }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Submit proposal
 */
export async function submitProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'submit' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Accept proposal
 */
export async function acceptProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'accept' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Reject proposal
 */
export async function rejectProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'reject' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Cancel proposal
 */
export async function cancelProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'cancel' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Reopen proposal
 */
export async function reopenProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'reopen' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Share proposal with client
 */
export async function shareProposal(id: string, emailRecipients?: string[]): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'share', emailRecipients }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Unshare proposal
 */
export async function unshareProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'unshare' }),
  })

  return handleResponse<ProposalResponse>(response)
}

/**
 * Delete proposal
 */
export async function deleteProposal(id: string): Promise<void> {
  const response = await fetch(`/api/proposals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete proposal')
  }
}

// ==================== Utility Functions ====================

/**
 * Calculate line item total
 */
export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

/**
 * Calculate proposal subtotal
 */
export function calculateSubtotal(items: ProposalLineItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0)
}

/**
 * Calculate proposal totals
 */
export function calculateProposalTotals(params: {
  subtotal: number
  adminMargin?: number
  shippingCost?: number
  taxPercentage?: number
}): { taxAmount: number; grandTotal: number } {
  const { subtotal, adminMargin = 0, shippingCost = 0, taxPercentage = 0 } = params

  const taxAmount = (subtotal + shippingCost) * (taxPercentage / 100)
  const grandTotal = subtotal + adminMargin + shippingCost + taxAmount

  return {
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  }
}

/**
 * Format line items for display
 */
export function formatLineItems(items: ProposalLineItem[]): ProposalLineItem[] {
  return items.map(item => ({
    ...item,
    totalPrice: calculateLineItemTotal(item.quantity, item.unitPrice),
  }))
}
