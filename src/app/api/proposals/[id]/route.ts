/**
 * Proposal Single Item API Routes
 *
 * GET /api/proposals/[id] - Get single proposal with details
 * PUT /api/proposals/[id] - Update proposal or perform actions
 * DELETE /api/proposals/[id] - Delete proposal (if allowed)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isSupplier, isClient } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  noContentResponse,
} from '@/lib/utils/response'
import { calculateProposalTotals } from '@/lib/utils/helpers'
import {
  updateProposalSchema,
  adminUpdateProposalSchema,
  proposalActionSchema,
  serializeLineItems,
  calculateSubtotal,
  parseLineItems,
} from '@/lib/validators/proposal'

// ==================== Types ====================

interface RouteParams {
  params: Promise<{ id: string }>
}

// ==================== Helper Functions ====================

/**
 * Check if user can access proposal
 */
function canAccessProposal(
  user: { id: string; role: string },
  proposal: { supplierId: string; isShared: boolean; status: string; rfqRequest: { clientId: string } }
): boolean {
  if (isAdmin(user)) return true
  if (isSupplier(user) && proposal.supplierId === user.id) return true
  if (isClient(user) && proposal.rfqRequest.clientId === user.id) {
    // Clients can only see shared or accepted proposals
    return proposal.isShared || proposal.status === 'ACCEPTED'
  }
  return false
}

/**
 * Check if supplier can edit proposal
 */
function canSupplierEdit(proposal: { supplierId: string; status: string }): boolean {
  // Supplier can only edit DRAFT proposals
  return proposal.status === 'DRAFT'
}

/**
 * Check if admin can edit commercial fields
 */
function canAdminEditStatus(proposal: { status: string }): boolean {
  // Admin can edit status for SUBMITTED or UNDER_REVIEW proposals
  return ['SUBMITTED', 'UNDER_REVIEW', 'DRAFT'].includes(proposal.status)
}

// ==================== GET /api/proposals/[id] - Get Single Proposal ====================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get proposal with all relations
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            avatar: true,
            phone: true,
            address: true,
          },
        },
        rfqRequest: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
            description: true,
            status: true,
            currency: true,
            deadlineDate: true,
            deliveryDate: true,
            deliveryAddress: true,
            deliveryTerms: true,
            category: true,
            requestType: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
                phone: true,
                address: true,
              },
            },
            lineItems: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!proposal) {
      return notFoundResponse('Proposal not found')
    }

    // Check access
    if (!canAccessProposal(currentUser, {
      supplierId: proposal.supplierId,
      isShared: proposal.isShared,
      status: proposal.status,
      rfqRequest: { clientId: proposal.rfqRequest.client?.id || '' },
    })) {
      return errorResponse('Access denied', 403)
    }

    // Parse JSON fields
    const parsedLineItems = parseLineItems(proposal.lineItems)
    const parsedAttachments = proposal.attachments ? JSON.parse(proposal.attachments) : []
    const parsedEmailSentTo = proposal.emailSentTo ? JSON.parse(proposal.emailSentTo) : []

    // Calculate derived fields
    const recalculatedSubtotal = calculateSubtotal(parsedLineItems)
    const totals = calculateProposalTotals({
      subtotal: proposal.subtotal || recalculatedSubtotal,
      adminMargin: proposal.adminMargin,
      shippingCost: proposal.shippingCost,
      taxPercentage: proposal.taxPercentage,
    })

    // Format response
    const formattedProposal = {
      ...proposal,
      lineItems: parsedLineItems,
      attachments: parsedAttachments,
      emailSentTo: parsedEmailSentTo,
      emailSentAt: proposal.emailSentAt?.toISOString() ?? null,
      sharedAt: proposal.sharedAt?.toISOString() ?? null,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      rfqRequest: {
        ...proposal.rfqRequest,
        deadlineDate: proposal.rfqRequest.deadlineDate?.toISOString() ?? null,
        deliveryDate: proposal.rfqRequest.deliveryDate?.toISOString() ?? null,
      },
      // Calculated totals
      calculatedSubtotal: recalculatedSubtotal,
      calculatedTaxAmount: totals.taxAmount,
      calculatedGrandTotal: totals.grandTotal,
      // Permission flags
      canEdit: isSupplier(currentUser) &&
        proposal.supplierId === currentUser.id &&
        canSupplierEdit(proposal),
      canAdminEdit: isAdmin(currentUser),
      canSubmit: isSupplier(currentUser) &&
        proposal.supplierId === currentUser.id &&
        proposal.status === 'DRAFT',
      canAccept: isAdmin(currentUser) && ['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status),
      canReject: isAdmin(currentUser) && ['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status),
      canShare: isAdmin(currentUser) && proposal.status === 'ACCEPTED',
    }

    return successResponse(formattedProposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return errorResponse('Failed to fetch proposal', 500)
  }
}

// ==================== PUT /api/proposals/[id] - Update Proposal ====================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing proposal
    const existingProposal = await db.proposal.findUnique({
      where: { id },
      include: {
        rfqRequest: {
          select: { id: true, status: true, clientId: true },
        },
      },
    })

    if (!existingProposal) {
      return notFoundResponse('Proposal not found')
    }

    // Parse request body
    const body = await request.json()

    // Check if this is an action request
    const actionParsed = proposalActionSchema.safeParse(body)
    if (actionParsed.success) {
      return handleProposalAction(currentUser, existingProposal, actionParsed.data)
    }

    // Role-based update logic
    if (isAdmin(currentUser)) {
      return handleAdminUpdate(id, existingProposal, body)
    } else if (isSupplier(currentUser) && existingProposal.supplierId === currentUser.id) {
      return handleSupplierUpdate(id, existingProposal, body)
    }

    return errorResponse('You do not have permission to update this proposal', 403)
  } catch (error) {
    console.error('Error updating proposal:', error)
    return errorResponse('Failed to update proposal', 500)
  }
}

// ==================== Supplier Update Handler ====================

async function handleSupplierUpdate(
  proposalId: string,
  existingProposal: {
    id: string
    supplierId: string
    status: string
    subtotal: number
    currency: string
    adminMargin: number
    shippingCost: number
    taxPercentage: number
  },
  body: unknown
) {
  // Check if proposal can be edited
  if (!canSupplierEdit(existingProposal)) {
    return errorResponse('Only DRAFT proposals can be edited by suppliers', 400)
  }

  // Validate update data
  const parsedData = updateProposalSchema.safeParse(body)
  if (!parsedData.success) {
    return validationErrorResponse(parsedData.error)
  }

  const data = parsedData.data

  // Prepare update data
  const updateData: Record<string, unknown> = {}

  if (data.lineItems) {
    const lineItems = data.lineItems.map(item => ({
      ...item,
      totalPrice: item.totalPrice ?? item.quantity * item.unitPrice,
    }))
    updateData.lineItems = serializeLineItems(lineItems)
    updateData.subtotal = data.subtotal ?? calculateSubtotal(lineItems)

    // Recalculate grand total with existing commercial fields
    const totals = calculateProposalTotals({
      subtotal: updateData.subtotal as number,
      adminMargin: existingProposal.adminMargin,
      shippingCost: existingProposal.shippingCost,
      taxPercentage: existingProposal.taxPercentage,
    })
    updateData.grandTotal = totals.grandTotal
  }

  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.attachments !== undefined) {
    updateData.attachments = data.attachments.length > 0 ? JSON.stringify(data.attachments) : null
  }
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.deliveryTerms !== undefined) updateData.deliveryTerms = data.deliveryTerms
  if (data.validity !== undefined) updateData.validity = data.validity

  // Update proposal
  const proposal = await db.proposal.update({
    where: { id: proposalId },
    data: updateData,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          avatar: true,
          phone: true,
        },
      },
      rfqRequest: {
        select: {
          id: true,
          requestNumber: true,
          title: true,
          status: true,
          currency: true,
          deadlineDate: true,
        },
      },
    },
  })

  return successResponse(formatProposalResponse(proposal), 'Proposal updated successfully')
}

// ==================== Admin Update Handler ====================

async function handleAdminUpdate(
  proposalId: string,
  existingProposal: {
    id: string
    status: string
    subtotal: number
    adminMargin: number
    shippingCost: number
    taxPercentage: number
  },
  body: unknown
) {
  // Validate update data
  const parsedData = adminUpdateProposalSchema.safeParse(body)
  if (!parsedData.success) {
    return validationErrorResponse(parsedData.error)
  }

  const data = parsedData.data

  // Prepare update data
  const updateData: Record<string, unknown> = {}

  // Handle commercial fields
  if (data.adminMargin !== undefined) updateData.adminMargin = data.adminMargin
  if (data.shippingCost !== undefined) updateData.shippingCost = data.shippingCost
  if (data.taxPercentage !== undefined) updateData.taxPercentage = data.taxPercentage
  if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount
  if (data.grandTotal !== undefined) updateData.grandTotal = data.grandTotal
  if (data.termsConditions !== undefined) updateData.termsConditions = data.termsConditions

  // Handle status change
  if (data.status !== undefined) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      UNDER_REVIEW: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      REJECTED: ['DRAFT'], // Allow reopening
      CANCELLED: ['DRAFT'], // Allow reopening
    }

    const allowed = validTransitions[existingProposal.status] || []
    if (!allowed.includes(data.status) && !isAdmin) {
      return errorResponse(
        `Cannot change status from ${existingProposal.status} to ${data.status}`,
        400
      )
    }

    updateData.status = data.status
  }

  // Handle sharing
  if (data.isShared !== undefined) {
    updateData.isShared = data.isShared
    if (data.isShared && !existingProposal.status.includes('ACCEPTED')) {
      // Only share accepted proposals
      return errorResponse('Only accepted proposals can be shared with clients', 400)
    }
    if (data.isShared) {
      updateData.sharedAt = new Date()
    }
  }

  // Handle email recipients
  if (data.emailSentTo !== undefined) {
    updateData.emailSentTo = data.emailSentTo.length > 0 ? JSON.stringify(data.emailSentTo) : null
  }

  // Recalculate totals if commercial fields changed
  if ('adminMargin' in updateData || 'shippingCost' in updateData || 'taxPercentage' in updateData) {
    const totals = calculateProposalTotals({
      subtotal: existingProposal.subtotal,
      adminMargin: updateData.adminMargin as number ?? existingProposal.adminMargin,
      shippingCost: updateData.shippingCost as number ?? existingProposal.shippingCost,
      taxPercentage: updateData.taxPercentage as number ?? existingProposal.taxPercentage,
    })
    updateData.taxAmount = totals.taxAmount
    updateData.grandTotal = totals.grandTotal
  }

  // Update proposal
  const proposal = await db.proposal.update({
    where: { id: proposalId },
    data: updateData,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          avatar: true,
          phone: true,
        },
      },
      rfqRequest: {
        select: {
          id: true,
          requestNumber: true,
          title: true,
          status: true,
          currency: true,
          deadlineDate: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
        },
      },
    },
  })

  // Create notification for supplier if status changed
  if (data.status && data.status !== existingProposal.status) {
    await db.notification.create({
      data: {
        userId: proposal.supplierId,
        title: 'Proposal Status Updated',
        message: `Your proposal ${proposal.proposalNumber} status has been updated to ${data.status}`,
        type: data.status === 'ACCEPTED' ? 'SUCCESS' : data.status === 'REJECTED' ? 'WARNING' : 'INFO',
        link: `/proposals/${proposal.id}`,
      },
    })
  }

  return successResponse(formatProposalResponse(proposal), 'Proposal updated successfully')
}

// ==================== Action Handler ====================

async function handleProposalAction(
  user: { id: string; role: string },
  proposal: {
    id: string
    proposalNumber: string
    supplierId: string
    status: string
    subtotal: number
    adminMargin: number
    shippingCost: number
    taxPercentage: number
    isShared: boolean
    rfqRequest: { id: string; clientId: string }
  },
  action: { action: string; emailRecipients?: string[] }
) {
  const { action: actionType, emailRecipients } = action

  // Submit action (Supplier only)
  if (actionType === 'submit') {
    if (!isSupplier(user) || proposal.supplierId !== user.id) {
      return errorResponse('Only the proposal owner can submit', 403)
    }
    if (proposal.status !== 'DRAFT') {
      return errorResponse('Only DRAFT proposals can be submitted', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: 'SUBMITTED' },
      include: getProposalInclude(),
    })

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'Proposal Submitted',
          message: `Proposal ${proposal.proposalNumber} has been submitted for review`,
          type: 'INFO',
          link: `/proposals/${proposal.id}`,
        })),
      })
    }

    return successResponse(formatProposalResponse(updated), 'Proposal submitted successfully')
  }

  // Accept action (Admin only)
  if (actionType === 'accept') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can accept proposals', 403)
    }
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status)) {
      return errorResponse('Only submitted or under-review proposals can be accepted', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: 'ACCEPTED' },
      include: getProposalInclude(),
    })

    // Update RFQ status
    await db.rFQRequest.update({
      where: { id: proposal.rfqRequest.id },
      data: { status: 'COMPLETED' },
    })

    // Notify supplier
    await db.notification.create({
      data: {
        userId: proposal.supplierId,
        title: 'Proposal Accepted!',
        message: `Congratulations! Your proposal ${proposal.proposalNumber} has been accepted.`,
        type: 'SUCCESS',
        link: `/proposals/${proposal.id}`,
      },
    })

    return successResponse(formatProposalResponse(updated), 'Proposal accepted successfully')
  }

  // Reject action (Admin only)
  if (actionType === 'reject') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can reject proposals', 403)
    }
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status)) {
      return errorResponse('Only submitted or under-review proposals can be rejected', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: 'REJECTED' },
      include: getProposalInclude(),
    })

    // Notify supplier
    await db.notification.create({
      data: {
        userId: proposal.supplierId,
        title: 'Proposal Rejected',
        message: `Your proposal ${proposal.proposalNumber} has been rejected.`,
        type: 'WARNING',
        link: `/proposals/${proposal.id}`,
      },
    })

    return successResponse(formatProposalResponse(updated), 'Proposal rejected')
  }

  // Cancel action
  if (actionType === 'cancel') {
    if (!isSupplier(user) || proposal.supplierId !== user.id) {
      if (!isAdmin(user)) {
        return errorResponse('Only the proposal owner or admin can cancel', 403)
      }
    }
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status)) {
      return errorResponse('Only draft, submitted, or under-review proposals can be cancelled', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: 'CANCELLED' },
      include: getProposalInclude(),
    })

    return successResponse(formatProposalResponse(updated), 'Proposal cancelled')
  }

  // Reopen action (Admin only)
  if (actionType === 'reopen') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can reopen proposals', 403)
    }
    if (!['REJECTED', 'CANCELLED'].includes(proposal.status)) {
      return errorResponse('Only rejected or cancelled proposals can be reopened', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: 'DRAFT' },
      include: getProposalInclude(),
    })

    return successResponse(formatProposalResponse(updated), 'Proposal reopened as draft')
  }

  // Share action (Admin only)
  if (actionType === 'share') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can share proposals', 403)
    }
    if (proposal.status !== 'ACCEPTED') {
      return errorResponse('Only accepted proposals can be shared with clients', 400)
    }
    if (proposal.isShared) {
      return errorResponse('Proposal is already shared with client', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: {
        isShared: true,
        sharedAt: new Date(),
        emailSentTo: emailRecipients && emailRecipients.length > 0
          ? JSON.stringify(emailRecipients)
          : null,
        emailSentAt: emailRecipients && emailRecipients.length > 0
          ? new Date()
          : null,
      },
      include: getProposalInclude(),
    })

    // Notify client
    await db.notification.create({
      data: {
        userId: proposal.rfqRequest.clientId,
        title: 'Proposal Shared',
        message: `A proposal for your RFQ has been shared with you.`,
        type: 'SUCCESS',
        link: `/proposals/${proposal.id}`,
      },
    })

    return successResponse(formatProposalResponse(updated), 'Proposal shared with client')
  }

  // Unshare action (Admin only)
  if (actionType === 'unshare') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can unshare proposals', 403)
    }
    if (!proposal.isShared) {
      return errorResponse('Proposal is not currently shared', 400)
    }

    const updated = await db.proposal.update({
      where: { id: proposal.id },
      data: { isShared: false, sharedAt: null },
      include: getProposalInclude(),
    })

    return successResponse(formatProposalResponse(updated), 'Proposal unshared')
  }

  return errorResponse('Invalid action', 400)
}

// ==================== DELETE /api/proposals/[id] - Delete Proposal ====================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing proposal
    const existingProposal = await db.proposal.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return notFoundResponse('Proposal not found')
    }

    // Only DRAFT proposals can be deleted, and only by the owner or admin
    if (existingProposal.status !== 'DRAFT') {
      return errorResponse('Only DRAFT proposals can be deleted', 400)
    }

    if (!isAdmin(currentUser) && existingProposal.supplierId !== currentUser.id) {
      return errorResponse('You do not have permission to delete this proposal', 403)
    }

    // Delete proposal
    await db.proposal.delete({
      where: { id },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return errorResponse('Failed to delete proposal', 500)
  }
}

// ==================== Helper Functions ====================

function getProposalInclude() {
  return {
    supplier: {
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        avatar: true,
        phone: true,
      },
    },
    rfqRequest: {
      select: {
        id: true,
        requestNumber: true,
        title: true,
        status: true,
        currency: true,
        deadlineDate: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    },
  }
}

function formatProposalResponse(proposal: {
  lineItems: string | null
  attachments: string | null
  emailSentTo: string | null
  emailSentAt: Date | null
  sharedAt: Date | null
  createdAt: Date
  updatedAt: Date
  rfqRequest: {
    deadlineDate: Date | null
    [key: string]: unknown
  }
  [key: string]: unknown
}) {
  return {
    ...proposal,
    lineItems: proposal.lineItems ? JSON.parse(proposal.lineItems) : [],
    attachments: proposal.attachments ? JSON.parse(proposal.attachments) : [],
    emailSentTo: proposal.emailSentTo ? JSON.parse(proposal.emailSentTo) : [],
    emailSentAt: proposal.emailSentAt?.toISOString() ?? null,
    sharedAt: proposal.sharedAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    rfqRequest: {
      ...proposal.rfqRequest,
      deadlineDate: proposal.rfqRequest.deadlineDate?.toISOString() ?? null,
    },
  }
}
