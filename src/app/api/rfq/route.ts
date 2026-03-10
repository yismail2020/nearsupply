/**
 * RFQ API Routes
 *
 * GET /api/rfq - List RFQs (role-based filtering)
 * POST /api/rfq - Create new RFQ
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isClient, isSupplier } from '@/lib/utils/auth'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  paginatedResponse,
} from '@/lib/utils/response'
import { generateRequestNumber } from '@/lib/utils/helpers'
import { createRFQSchema, rfqQuerySchema } from '@/lib/validators/rfq'

// ==================== GET /api/rfq - List RFQs ====================

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
    const parsedQuery = rfqQuerySchema.safeParse(queryParams)

    if (!parsedQuery.success) {
      return validationErrorResponse(parsedQuery.error)
    }

    const { page, limit, status, category, search, sortBy, sortOrder } = parsedQuery.data
    const skip = (page - 1) * limit

    // Build where clause based on role
    const where: Record<string, unknown> = {}
    const orConditions: Record<string, unknown>[] = []

    // Role-based filtering
    if (isAdmin(currentUser)) {
      // ADMIN sees all RFQs
      // Can filter by clientId if provided
      const clientId = searchParams.get('clientId')
      if (clientId) {
        where.clientId = clientId
      }
    } else if (isClient(currentUser)) {
      // CLIENT sees only their own RFQs
      where.clientId = currentUser.id
    } else if (isSupplier(currentUser)) {
      // SUPPLIER sees:
      // 1. RFQs that are SUBMITTED (open to all suppliers)
      // 2. RFQs where they have submitted proposals
      // For now, show SUBMITTED and later stages where they have proposals
      orConditions.push(
        { status: 'SUBMITTED' },
        { status: 'ASSIGNED' },
        { status: 'QUOTES_RECEIVED' },
        { status: 'UNDER_REVIEW' },
      )
    }

    // Add filters
    if (status) {
      if (orConditions.length > 0) {
        // For suppliers, intersect with status filter
        orConditions.length = 0
        orConditions.push({ status })
      } else {
        where.status = status
      }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      const searchCondition = {
        OR: [
          { title: { contains: search } },
          { requestNumber: { contains: search } },
          { description: { contains: search } },
        ],
      }

      if (orConditions.length > 0) {
        where.AND = [{ OR: orConditions }, searchCondition]
      } else {
        Object.assign(where, searchCondition)
      }
    } else if (orConditions.length > 0) {
      where.OR = orConditions
    }

    // Build orderBy
    const orderBy: Record<string, unknown> = {}
    if (sortBy === 'deadlineDate') {
      orderBy.deadlineDate = { sort: sortOrder, nulls: 'last' }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Get total count
    const total = await db.rFQRequest.count({ where })

    // Get RFQs with relations
    const rfqs = await db.rFQRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
        proposals: {
          select: {
            id: true,
            proposalNumber: true,
            status: true,
            supplierId: true,
            createdAt: true,
          },
        },
        _count: {
          select: { proposals: true },
        },
      },
    })

    // Format response
    const formattedRfqs = rfqs.map((rfq) => ({
      ...rfq,
      lineItemsCount: rfq.lineItems.length,
      proposalsCount: rfq._count.proposals,
      submissionDate: rfq.submissionDate?.toISOString() ?? null,
      deadlineDate: rfq.deadlineDate?.toISOString() ?? null,
      deliveryDate: rfq.deliveryDate?.toISOString() ?? null,
      createdAt: rfq.createdAt.toISOString(),
      updatedAt: rfq.updatedAt.toISOString(),
    }))

    return paginatedResponse(formattedRfqs, page, limit, total)
  } catch (error) {
    console.error('Error fetching RFQs:', error)
    return errorResponse('Failed to fetch RFQs', 500)
  }
}

// ==================== POST /api/rfq - Create RFQ ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN and CLIENT can create RFQs
    if (!isAdmin(currentUser) && !isClient(currentUser)) {
      return errorResponse('Only administrators and clients can create RFQs', 403)
    }

    // Parse request body
    const body = await request.json()
    const parsedData = createRFQSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Generate request number
    const requestNumber = await generateRequestNumber()

    // Prepare line items with sort order
    const lineItems = data.lineItems.map((item, index) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      specifications: item.specifications,
      link: item.link || null,
      imageUrl: item.imageUrl || null,
      sortOrder: item.sortOrder ?? index,
    }))

    // Create RFQ with line items
    const rfq = await db.rFQRequest.create({
      data: {
        requestNumber,
        requestType: data.requestType,
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        currency: data.currency,
        deadlineDate: data.deadlineDate ? new Date(data.deadlineDate) : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        deliveryTerms: data.deliveryTerms,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        internalNotes: isAdmin(currentUser) ? data.internalNotes : undefined,
        status: 'DRAFT',
        clientId: currentUser.id,
        lineItems: {
          create: lineItems,
        },
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

    // Create notification for admins when a client creates an RFQ
    if (isClient(currentUser)) {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      })

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: 'New RFQ Created',
            message: `New RFQ "${rfq.title}" (${rfq.requestNumber}) has been created by ${currentUser.name || currentUser.email}`,
            type: 'INFO',
            link: `/rfq/${rfq.id}`,
          })),
        })
      }
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

    return createdResponse(formattedRfq, 'RFQ created successfully')
  } catch (error) {
    console.error('Error creating RFQ:', error)
    return errorResponse('Failed to create RFQ', 500)
  }
}
