/**
 * Proposal Types
 *
 * TypeScript types for Proposal data structures
 */

// ==================== Enums ====================

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'

// ==================== Line Item ====================

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

// ==================== User ====================

export interface ProposalUser {
  id: string
  name: string | null
  email: string
  company: string | null
  avatar: string | null
  phone?: string | null
}

// ==================== RFQ Summary ====================

export interface RFQSummary {
  id: string
  requestNumber: string
  title: string
  status: string
  currency: string
  deadlineDate: string | null
  client?: ProposalUser
  lineItems?: Array<{
    id: string
    name: string
    quantity: number
    unit: string | null
  }>
}

// ==================== Proposal ====================

export interface Proposal {
  id: string
  proposalNumber: string
  rfqRequestId: string
  supplierId: string
  lineItems: ProposalLineItem[]
  subtotal: number
  currency: string
  attachments: string[]
  notes: string | null
  deliveryTerms: string | null
  validity: number | null
  status: ProposalStatus
  adminMargin: number
  shippingCost: number
  taxPercentage: number
  taxAmount: number
  grandTotal: number
  termsConditions: string | null
  emailSentAt: string | null
  emailSentTo: string[]
  isShared: boolean
  sharedAt: string | null
  createdAt: string
  updatedAt: string
  supplier: ProposalUser
  rfqRequest: RFQSummary
}

export interface ProposalDetail extends Proposal {
  calculatedSubtotal?: number
  calculatedTaxAmount?: number
  calculatedGrandTotal?: number
  canEdit: boolean
  canAdminEdit: boolean
  canSubmit: boolean
  canAccept: boolean
  canReject: boolean
  canShare: boolean
}

// ==================== Form Types ====================

export interface ProposalFormData {
  rfqRequestId: string
  lineItems: ProposalLineItem[]
  subtotal: number
  currency: string
  attachments: string[]
  notes: string
  deliveryTerms: string
  validity: string
}

export interface AdminProposalFormData {
  adminMargin: string
  shippingCost: string
  taxPercentage: string
  termsConditions: string
  status?: ProposalStatus
  isShared?: boolean
  emailSentTo?: string[]
}

// ==================== Query Types ====================

export interface ProposalQueryParams {
  page?: number
  limit?: number
  status?: ProposalStatus
  rfqRequestId?: string
  supplierId?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'grandTotal' | 'status' | 'proposalNumber'
  sortOrder?: 'asc' | 'desc'
}

// ==================== API Response Types ====================

export interface ProposalListResponse {
  success: boolean
  data: {
    data: Proposal[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export interface ProposalResponse {
  success: boolean
  data: ProposalDetail
  message?: string
}

export interface ProposalCreateResponse {
  success: boolean
  data: Proposal
  message?: string
}
