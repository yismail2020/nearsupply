/**
 * RFQ Types
 *
 * TypeScript types for RFQ data structures
 */

// ==================== Enums ====================

export type RFQStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'QUOTES_RECEIVED'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'

export type RFQRequestType = 'PRODUCT' | 'SERVICE'

// ==================== Line Item ====================

export interface RFQLineItem {
  id: string
  rfqRequestId: string
  name: string
  quantity: number
  unit: string | null
  specifications: string | null
  link: string | null
  imageUrl: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface RFQLineItemInput {
  id?: string
  name: string
  quantity: number
  unit?: string
  specifications?: string
  link?: string
  imageUrl?: string
  sortOrder?: number
}

// ==================== RFQ ====================

export interface RFQClient {
  id: string
  name: string | null
  email: string
  company: string | null
  avatar: string | null
}

export interface ProposalSummary {
  id: string
  proposalNumber: string
  status: string
  supplierId: string
  createdAt: string
}

export interface RFQ {
  id: string
  requestNumber: string
  requestType: RFQRequestType
  title: string
  description: string | null
  category: string | null
  budget: number | null
  currency: string
  submissionDate: string | null
  deadlineDate: string | null
  deliveryDate: string | null
  deliveryTerms: string | null
  deliveryAddress: string | null
  notes: string | null
  internalNotes: string | null
  status: RFQStatus
  clientId: string
  createdAt: string
  updatedAt: string
  client: RFQClient
  lineItems: RFQLineItem[]
  proposals?: ProposalSummary[]
  lineItemsCount?: number
  proposalsCount?: number
}

export interface RFQDetail extends RFQ {
  canEdit: boolean
  canDelete: boolean
  canSubmit: boolean
  canCancel: boolean
}

// ==================== Form Types ====================

export interface RFQFormData {
  requestType: RFQRequestType
  title: string
  description: string
  category: string
  budget: string
  currency: string
  deadlineDate: string
  deliveryDate: string
  deliveryTerms: string
  deliveryAddress: string
  notes: string
  internalNotes: string
  attachments: string[]
  lineItems: RFQLineItemInput[]
}

// ==================== Query Types ====================

export interface RFQQueryParams {
  page?: number
  limit?: number
  status?: RFQStatus
  category?: string
  search?: string
  clientId?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'deadlineDate' | 'title' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// ==================== API Response Types ====================

export interface RFQListResponse {
  success: boolean
  data: {
    data: RFQ[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export interface RFQResponse {
  success: boolean
  data: RFQDetail
  message?: string
}

export interface RFQCreateResponse {
  success: boolean
  data: RFQ
  message?: string
}
