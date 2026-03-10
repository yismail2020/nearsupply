/**
 * RFQ API Client
 *
 * Client-side API functions for RFQ operations
 */

import type {
  RFQ,
  RFQDetail,
  RFQFormData,
  RFQQueryParams,
  RFQListResponse,
  RFQResponse,
  RFQCreateResponse,
  RFQLineItemInput,
} from '@/types/rfq'

// ==================== Helper ====================

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred')
  }

  return data
}

// ==================== Query Params Builder ====================

function buildQueryString(params: RFQQueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.status) searchParams.set('status', params.status)
  if (params.category) searchParams.set('category', params.category)
  if (params.search) searchParams.set('search', params.search)
  if (params.clientId) searchParams.set('clientId', params.clientId)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ==================== Transform Form Data ====================

function transformFormData(formData: RFQFormData) {
  return {
    requestType: formData.requestType,
    title: formData.title,
    description: formData.description || undefined,
    category: formData.category || undefined,
    budget: formData.budget ? parseFloat(formData.budget) : undefined,
    currency: formData.currency,
    deadlineDate: formData.deadlineDate || null,
    deliveryDate: formData.deliveryDate || null,
    deliveryTerms: formData.deliveryTerms || undefined,
    deliveryAddress: formData.deliveryAddress || undefined,
    notes: formData.notes || undefined,
    internalNotes: formData.internalNotes || undefined,
    attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
    lineItems: formData.lineItems.map((item, index) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || undefined,
      specifications: item.specifications || undefined,
      link: item.link || undefined,
      imageUrl: item.imageUrl || undefined,
      sortOrder: item.sortOrder ?? index,
    })),
  }
}

// ==================== API Functions ====================

/**
 * Get list of RFQs
 */
export async function getRFQs(params: RFQQueryParams = {}): Promise<RFQListResponse> {
  const queryString = buildQueryString(params)
  const response = await fetch(`/api/rfq${queryString}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<RFQListResponse>(response)
}

/**
 * Get single RFQ by ID
 */
export async function getRFQ(id: string): Promise<RFQResponse> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<RFQResponse>(response)
}

/**
 * Create new RFQ
 */
export async function createRFQ(data: RFQFormData): Promise<RFQCreateResponse> {
  const response = await fetch('/api/rfq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(transformFormData(data)),
  })

  return handleResponse<RFQCreateResponse>(response)
}

/**
 * Update existing RFQ
 */
export async function updateRFQ(id: string, data: Partial<RFQFormData>): Promise<RFQResponse> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(transformFormData(data as RFQFormData)),
  })

  return handleResponse<RFQResponse>(response)
}

/**
 * Submit RFQ (change status from DRAFT to SUBMITTED)
 */
export async function submitRFQ(id: string): Promise<RFQResponse> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'submit' }),
  })

  return handleResponse<RFQResponse>(response)
}

/**
 * Cancel RFQ
 */
export async function cancelRFQ(id: string): Promise<RFQResponse> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'cancel' }),
  })

  return handleResponse<RFQResponse>(response)
}

/**
 * Reopen RFQ (admin only)
 */
export async function reopenRFQ(id: string): Promise<RFQResponse> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ action: 'reopen' }),
  })

  return handleResponse<RFQResponse>(response)
}

/**
 * Delete RFQ
 */
export async function deleteRFQ(id: string): Promise<void> {
  const response = await fetch(`/api/rfq/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete RFQ')
  }
}

// ==================== CSV Utilities ====================

/**
 * Export line items to CSV
 */
export function exportLineItemsToCSV(items: RFQLineItemInput[]): string {
  const headers = ['Name', 'Quantity', 'Unit', 'Specifications', 'Link', 'Image URL']
  const rows = items.map(item => [
    item.name,
    item.quantity.toString(),
    item.unit || '',
    item.specifications || '',
    item.link || '',
    item.imageUrl || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Parse CSV to line items
 */
export function parseCSVToLineItems(csvContent: string): RFQLineItemInput[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  // Skip header row
  const dataLines = lines.slice(1)
  
  return dataLines.map((line, index) => {
    // Simple CSV parsing (doesn't handle all edge cases)
    const cells = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []
    const cleanCells = cells.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'))

    return {
      name: cleanCells[0] || `Item ${index + 1}`,
      quantity: parseFloat(cleanCells[1]) || 1,
      unit: cleanCells[2] || undefined,
      specifications: cleanCells[3] || undefined,
      link: cleanCells[4] || undefined,
      imageUrl: cleanCells[5] || undefined,
      sortOrder: index,
    }
  }).filter(item => item.name.trim() !== '')
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Get CSV template content
 */
export function getCSVTemplate(): string {
  return `Name,Quantity,Unit,Specifications,Link,Image URL
"Example Item 1",10,pcs,"Size: Large, Color: Blue",,
"Example Item 2",5,sets,"Model: ABC-123",https://example.com/product,https://example.com/image.jpg
"Example Item 3",100,units,,,`
}
