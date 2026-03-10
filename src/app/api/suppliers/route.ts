import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response'

// GET - List Suppliers (for admin/client to assign to RFQs)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Only ADMIN and CLIENT can list suppliers
    if (user.role !== 'ADMIN' && user.role !== 'CLIENT') {
      return errorResponse('Access denied', 403)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: Record<string, unknown> = {
      role: 'SUPPLIER',
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }

    const suppliers = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            proposals: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return successResponse(suppliers)
  } catch (error) {
    console.error('List suppliers error:', error)
    return errorResponse('Failed to fetch suppliers', 500)
  }
}
