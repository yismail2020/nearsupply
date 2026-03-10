/**
 * Proposals API Routes
 *
 * GET /api/proposals - List proposals (role-based filtering)
 * POST /api/proposals - Create new proposal (SUPPLIER only)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isSupplier, isClient } from '@/lib/utils/auth'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  paginatedResponse,
} from '@/lib/utils/response'
import { generateProposalNumber, calculateProposalTotals } from '@/lib/utils/helpers'
import { createProposalSchema, proposalQuerySchema, serializeLineItems, calculateSubtotal } from '@/lib/validators/proposal'

// ==================== GET /api/proposals - List Proposals ====================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const parsedQuery = proposalQuerySchema.safeParse(queryParams)

    if (!parsedQuery.success) {
      return validationErrorResponse(parsedQuery.error)
    }

    const { page, limit, status, rfqRequestId, supplierId, search, sortBy, sortOrder } = parsedQuery.data
    const skip = (page - 1) * limit

    // Build where clause based on role
    const where: Record<string, unknown> = {}

    // Role-based filtering
    if (isAdmin(currentUser)) {
      // ADMIN sees all proposals
      if (rfqRequestId) where.rfqRequestId = rfqRequestId
      if (supplierId) where.supplierId = supplierId
    } else if (isSupplier(currentUser)) {
      // SUPPLIER sees only their own proposals
      where.supplierId = currentUser.id
      if (rfqRequestId) where.rfqRequestId = rfqRequestId
    } else if (isClient(currentUser)) {
      // CLIENT sees proposals for RFQs they own
      // Only after proposals are shared (isShared = true) or when status is ACCEPTED
      where.rfqRequest = {
        clientId: currentUser.id,
      }
      // Clients can only see shared or accepted proposals
      where.OR = [
        { isShared: true },
        { status: 'ACCEPTED' },
      ]
      if (rfqRequestId) where.rfqRequestId = rfqRequestId
    }

    // Add filters
    if (status) {
      where.status = status
    }

    if (search) {
      const searchCondition = {
        OR: [
          { proposalNumber: { contains: search } },
          { notes: { contains: search } },
        ],
      }

      if (where.OR) {
        // For clients, combine with existing OR condition
        where.AND = [
          { OR: where.OR },
          searchCondition,
        ]
        delete where.OR
      } else {
        Object.assign(where, searchCondition)
      }
    } else if (where.OR && Array.isArray(where.OR) && where.OR.length === 0) {
      delete where.OR
    }

    // Build orderBy
    const orderBy: Record<string, unknown> = {}
    orderBy[sortBy] = sortOrder

    // Get total count
    const total = await db.proposal.count({ where })

    // Get proposals with relations
    const proposals = await db.proposal.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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

    // Format response
    const formattedProposals = proposals.map((proposal) => ({
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
    }))

    return paginatedResponse(formattedProposals, page, limit, total)
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return errorResponse('Failed to fetch proposals', 500)
  }
}

// ==================== POST /api/proposals - Create Proposal ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only SUPPLIER can create proposals
    if (!isSupplier(currentUser)) {
      return errorResponse('Only suppliers can create proposals', 403)
    }

    // Parse request body
    const body = await request.json()
    const parsedData = createProposalSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Verify RFQ exists and is open for proposals
    const rfq = await db.rFQRequest.findUnique({
      where: { id: data.rfqRequestId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!rfq) {
      return errorResponse('RFQ not found', 404)
    }

    // Check RFQ status - must be SUBMITTED, ASSIGNED, or QUOTES_RECEIVED
    const validRFQStatuses = ['SUBMITTED', 'ASSIGNED', 'QUOTES_RECEIVED', 'UNDER_REVIEW']
    if (!validRFQStatuses.includes(rfq.status)) {
      return errorResponse(
        `Cannot create proposal for RFQ with status "${rfq.status}". RFQ must be open for proposals.`,
        400
      )
    }

    // Check if supplier already has a proposal for this RFQ
    const existingProposal = await db.proposal.findFirst({
      where: {
        rfqRequestId: data.rfqRequestId,
        supplierId: currentUser.id,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingProposal) {
      return errorResponse(
        'You already have an active proposal for this RFQ. Please edit the existing one.',
        409
      )
    }

    // Generate proposal number
    const proposalNumber = await generateProposalNumber()

    // Process line items
    const lineItems = data.lineItems.map(item => ({
      ...item,
      totalPrice: item.totalPrice ?? item.quantity * item.unitPrice,
    }))

    // Calculate subtotal
    const subtotal = data.subtotal ?? calculateSubtotal(lineItems)

    // Use RFQ currency if not specified
    const currency = data.currency ?? rfq.currency

    // Serialize data
    const lineItemsJson = serializeLineItems(lineItems)
    const attachmentsJson = data.attachments && data.attachments.length > 0
      ? JSON.stringify(data.attachments)
      : null

    // Create proposal
    const proposal = await db.proposal.create({
      data: {
        proposalNumber,
        rfqRequestId: data.rfqRequestId,
        supplierId: currentUser.id,
        lineItems: lineItemsJson,
        subtotal,
        currency,
        attachments: attachmentsJson,
        notes: data.notes,
        deliveryTerms: data.deliveryTerms,
        validity: data.validity,
        status: data.status ?? 'DRAFT',
        // Initialize commercial fields
        adminMargin: 0,
        shippingCost: 0,
        taxPercentage: 0,
        taxAmount: 0,
        grandTotal: subtotal,
      },
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

    // Update RFQ status to QUOTES_RECEIVED if this is the first proposal
    if (rfq.status === 'SUBMITTED' || rfq.status === 'ASSIGNED') {
      await db.rFQRequest.update({
        where: { id: data.rfqRequestId },
        data: { status: 'QUOTES_RECEIVED' },
      })
    }

    // Notify admins about new proposal
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: 'New Proposal Submitted',
          message: `New proposal ${proposal.proposalNumber} from ${currentUser.company || currentUser.name || currentUser.email} for RFQ ${rfq.requestNumber}`,
          type: 'INFO',
          link: `/proposals/${proposal.id}`,
        })),
      })
    }

    // Format response
    const formattedProposal = {
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

    return createdResponse(formattedProposal, 'Proposal created successfully')
  } catch (error) {
    console.error('Error creating proposal:', error)
    return errorResponse('Failed to create proposal', 500)
  }
}
