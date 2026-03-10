/**
 * RFQ Single Item API Routes
 *
 * GET /api/rfq/[id] - Get single RFQ with details
 * PUT /api/rfq/[id] - Update RFQ or perform actions (submit, cancel)
 * DELETE /api/rfq/[id] - Delete RFQ (if allowed)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isClient, isSupplier } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  noContentResponse,
} from '@/lib/utils/response'
import { updateRFQSchema, rfqActionSchema } from '@/lib/validators/rfq'

// ==================== Helper Functions ====================

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Check if user can access RFQ
 */
function canAccessRFQ(
  user: { id: string; role: string },
  rfq: { clientId: string; status: string }
): boolean {
  if (isAdmin(user)) return true
  if (isClient(user) && rfq.clientId === user.id) return true
  if (isSupplier(user)) {
    // Suppliers can access submitted or later stage RFQs
    const supplierVisibleStatuses = ['SUBMITTED', 'ASSIGNED', 'QUOTES_RECEIVED', 'UNDER_REVIEW']
    return supplierVisibleStatuses.includes(rfq.status)
  }
  return false
}

/**
 * Check if user can edit RFQ
 */
function canEditRFQ(
  user: { id: string; role: string },
  rfq: { clientId: string; status: string }
): boolean {
  // Only DRAFT status can be edited
  if (rfq.status !== 'DRAFT') return false

  if (isAdmin(user)) return true
  if (isClient(user) && rfq.clientId === user.id) return true
  return false
}

/**
 * Check if user can delete RFQ
 */
function canDeleteRFQ(
  user: { id: string; role: string },
  rfq: { clientId: string; status: string; proposals: unknown[] }
): boolean {
  // Only DRAFT or CANCELLED status with no proposals can be deleted
  if (!['DRAFT', 'CANCELLED'].includes(rfq.status)) return false
  if (rfq.proposals.length > 0) return false

  if (isAdmin(user)) return true
  if (isClient(user) && rfq.clientId === user.id) return true
  return false
}

// ==================== GET /api/rfq/[id] - Get Single RFQ ====================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get RFQ with all relations
    const rfq = await db.rFQRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            avatar: true,
            address: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        proposals: {
          select: {
            id: true,
            proposalNumber: true,
            status: true,
            supplierId: true,
            grandTotal: true,
            currency: true,
            createdAt: true,
            supplier: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!rfq) {
      return notFoundResponse('RFQ not found')
    }

    // Check access
    if (!canAccessRFQ(currentUser, rfq)) {
      return errorResponse('Access denied', 403)
    }

    // Format response
    const formattedRfq = {
      ...rfq,
      submissionDate: rfq.submissionDate?.toISOString() ?? null,
      deadlineDate: rfq.deadlineDate?.toISOString() ?? null,
      deliveryDate: rfq.deliveryDate?.toISOString() ?? null,
      createdAt: rfq.createdAt.toISOString(),
      updatedAt: rfq.updatedAt.toISOString(),
      lineItems: rfq.lineItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      proposals: rfq.proposals.map((proposal) => ({
        ...proposal,
        createdAt: proposal.createdAt.toISOString(),
      })),
      canEdit: canEditRFQ(currentUser, rfq),
      canDelete: canDeleteRFQ(currentUser, { ...rfq, proposals: rfq.proposals }),
      canSubmit: rfq.status === 'DRAFT' && (isAdmin(currentUser) || (isClient(currentUser) && rfq.clientId === currentUser.id)),
      canCancel: ['DRAFT', 'SUBMITTED', 'ASSIGNED'].includes(rfq.status) && (isAdmin(currentUser) || (isClient(currentUser) && rfq.clientId === currentUser.id)),
    }

    return successResponse(formattedRfq)
  } catch (error) {
    console.error('Error fetching RFQ:', error)
    return errorResponse('Failed to fetch RFQ', 500)
  }
}

// ==================== PUT /api/rfq/[id] - Update RFQ ====================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing RFQ
    const existingRfq = await db.rFQRequest.findUnique({
      where: { id },
      include: {
        proposals: { select: { id: true } },
      },
    })

    if (!existingRfq) {
      return notFoundResponse('RFQ not found')
    }

    // Parse request body
    const body = await request.json()

    // Check if this is an action request
    const actionParsed = rfqActionSchema.safeParse(body)
    if (actionParsed.success) {
      return handleRFQAction(currentUser, existingRfq, actionParsed.data.action)
    }

    // Regular update - check edit permission
    if (!canEditRFQ(currentUser, existingRfq)) {
      return errorResponse(
        existingRfq.status !== 'DRAFT'
          ? 'Only RFQs in DRAFT status can be edited'
          : 'You do not have permission to edit this RFQ',
        403
      )
    }

    // Validate update data
    const parsedData = updateRFQSchema.safeParse(body)
    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (data.requestType !== undefined) updateData.requestType = data.requestType
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.budget !== undefined) updateData.budget = data.budget
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.deadlineDate !== undefined) updateData.deadlineDate = data.deadlineDate ? new Date(data.deadlineDate) : null
    if (data.deliveryDate !== undefined) updateData.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null
    if (data.deliveryTerms !== undefined) updateData.deliveryTerms = data.deliveryTerms
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress
    if (data.notes !== undefined) updateData.notes = data.notes
    if (isAdmin(currentUser) && data.internalNotes !== undefined) {
      updateData.internalNotes = data.internalNotes
    }

    // Update RFQ
    const rfq = await db.rFQRequest.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            avatar: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    // Update line items if provided
    if (data.lineItems) {
      // Delete existing line items
      await db.rFQItem.deleteMany({
        where: { rfqRequestId: id },
      })

      // Create new line items
      const lineItems = data.lineItems.map((item, index) => ({
        rfqRequestId: id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        specifications: item.specifications,
        link: item.link || null,
        imageUrl: item.imageUrl || null,
        sortOrder: item.sortOrder ?? index,
      }))

      await db.rFQItem.createMany({ data: lineItems })

      // Fetch updated line items
      const updatedLineItems = await db.rFQItem.findMany({
        where: { rfqRequestId: id },
        orderBy: { sortOrder: 'asc' },
      })

      rfq.lineItems = updatedLineItems
    }

    // Format response
    const formattedRfq = {
      ...rfq,
      submissionDate: rfq.submissionDate?.toISOString() ?? null,
      deadlineDate: rfq.deadlineDate?.toISOString() ?? null,
      deliveryDate: rfq.deliveryDate?.toISOString() ?? null,
      createdAt: rfq.createdAt.toISOString(),
      updatedAt: rfq.updatedAt.toISOString(),
      lineItems: rfq.lineItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    }

    return successResponse(formattedRfq, 'RFQ updated successfully')
  } catch (error) {
    console.error('Error updating RFQ:', error)
    return errorResponse('Failed to update RFQ', 500)
  }
}

// ==================== Handle RFQ Actions ====================

async function handleRFQAction(
  user: { id: string; role: string },
  rfq: { id: string; clientId: string; status: string; title: string; requestNumber: string; proposals: { id: string }[] },
  action: 'submit' | 'cancel' | 'reopen'
) {
  // Submit action
  if (action === 'submit') {
    // Check permission
    if (!isAdmin(user) && !(isClient(user) && rfq.clientId === user.id)) {
      return errorResponse('You do not have permission to submit this RFQ', 403)
    }

    // Check status
    if (rfq.status !== 'DRAFT') {
      return errorResponse('Only RFQs in DRAFT status can be submitted', 400)
    }

    // Update status
    const updated = await db.rFQRequest.update({
      where: { id: rfq.id },
      data: {
        status: 'SUBMITTED',
        submissionDate: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            avatar: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
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
          title: 'RFQ Submitted',
          message: `RFQ "${rfq.title}" (${rfq.requestNumber}) has been submitted and is ready for supplier assignment`,
          type: 'SUCCESS',
          link: `/rfq/${rfq.id}`,
        })),
      })
    }

    return successResponse(
      {
        ...updated,
        submissionDate: updated.submissionDate?.toISOString() ?? null,
        deadlineDate: updated.deadlineDate?.toISOString() ?? null,
        deliveryDate: updated.deliveryDate?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      'RFQ submitted successfully'
    )
  }

  // Cancel action
  if (action === 'cancel') {
    // Check permission
    if (!isAdmin(user) && !(isClient(user) && rfq.clientId === user.id)) {
      return errorResponse('You do not have permission to cancel this RFQ', 403)
    }

    // Check status
    if (!['DRAFT', 'SUBMITTED', 'ASSIGNED'].includes(rfq.status)) {
      return errorResponse('Only RFQs in DRAFT, SUBMITTED, or ASSIGNED status can be cancelled', 400)
    }

    // Update status
    const updated = await db.rFQRequest.update({
      where: { id: rfq.id },
      data: { status: 'CANCELLED' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            avatar: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return successResponse(
      {
        ...updated,
        submissionDate: updated.submissionDate?.toISOString() ?? null,
        deadlineDate: updated.deadlineDate?.toISOString() ?? null,
        deliveryDate: updated.deliveryDate?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      'RFQ cancelled successfully'
    )
  }

  // Reopen action (admin only)
  if (action === 'reopen') {
    if (!isAdmin(user)) {
      return errorResponse('Only administrators can reopen RFQs', 403)
    }

    // Check status
    if (rfq.status !== 'CANCELLED') {
      return errorResponse('Only cancelled RFQs can be reopened', 400)
    }

    // Update status
    const updated = await db.rFQRequest.update({
      where: { id: rfq.id },
      data: { status: 'DRAFT' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            avatar: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return successResponse(
      {
        ...updated,
        submissionDate: updated.submissionDate?.toISOString() ?? null,
        deadlineDate: updated.deadlineDate?.toISOString() ?? null,
        deliveryDate: updated.deliveryDate?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      'RFQ reopened successfully'
    )
  }

  return errorResponse('Invalid action', 400)
}

// ==================== DELETE /api/rfq/[id] - Delete RFQ ====================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing RFQ
    const existingRfq = await db.rFQRequest.findUnique({
      where: { id },
      include: {
        proposals: { select: { id: true } },
      },
    })

    if (!existingRfq) {
      return notFoundResponse('RFQ not found')
    }

    // Check delete permission
    if (!canDeleteRFQ(currentUser, existingRfq)) {
      if (existingRfq.proposals.length > 0) {
        return errorResponse('Cannot delete RFQ with existing proposals', 400)
      }
      if (!['DRAFT', 'CANCELLED'].includes(existingRfq.status)) {
        return errorResponse('Only RFQs in DRAFT or CANCELLED status can be deleted', 400)
      }
      return errorResponse('You do not have permission to delete this RFQ', 403)
    }

    // Delete RFQ (cascade will delete line items)
    await db.rFQRequest.delete({
      where: { id },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Error deleting RFQ:', error)
    return errorResponse('Failed to delete RFQ', 500)
  }
}
