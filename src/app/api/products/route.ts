/**
 * Products API Routes
 *
 * GET /api/products - List products (role-based filtering)
 * POST /api/products - Create new product (SUPPLIER only)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isSupplier } from '@/lib/utils/auth'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  paginatedResponse,
} from '@/lib/utils/response'
import { createProductSchema, productQuerySchema } from '@/lib/validators/product'

// ==================== GET /api/products - List Products ====================

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
    const parsedQuery = productQuerySchema.safeParse(queryParams)

    if (!parsedQuery.success) {
      return validationErrorResponse(parsedQuery.error)
    }

    const { page, limit, status, category, supplierId, search, featured, sortBy, sortOrder } = parsedQuery.data
    const skip = (page - 1) * limit

    // Build where clause based on role
    const where: Record<string, unknown> = {}

    // Role-based filtering
    if (isAdmin(currentUser)) {
      // ADMIN sees all products, can filter by supplierId
      if (supplierId) where.supplierId = supplierId
    } else if (isSupplier(currentUser)) {
      // SUPPLIER sees only their own products
      where.supplierId = currentUser.id
    } else {
      // CLIENT sees all ACTIVE products (for browsing)
      where.status = 'ACTIVE'
    }

    // Add filters
    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (featured !== undefined) {
      where.isFeatured = featured
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    // Build orderBy
    const orderBy: Record<string, unknown> = {}
    orderBy[sortBy] = sortOrder

    // Get total count
    const total = await db.product.count({ where })

    // Get products with supplier info
    const products = await db.product.findMany({
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
          },
        },
      },
    })

    // Format response
    const formattedProducts = products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }))

    return paginatedResponse(formattedProducts, page, limit, total)
  } catch (error) {
    console.error('Error fetching products:', error)
    return errorResponse('Failed to fetch products', 500)
  }
}

// ==================== POST /api/products - Create Product ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only SUPPLIER can create products
    if (!isSupplier(currentUser)) {
      return errorResponse('Only suppliers can create products', 403)
    }

    // Parse request body
    const body = await request.json()
    const parsedData = createProductSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Create product
    const product = await db.product.create({
      data: {
        supplierId: currentUser.id,
        name: data.name,
        description: data.description,
        category: data.category,
        sku: data.sku,
        unitPrice: data.unitPrice,
        currency: data.currency,
        minimumOrderQuantity: data.minimumOrderQuantity,
        unit: data.unit,
        isFeatured: data.isFeatured,
        status: data.status,
      },
      include: {
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
    })

    // Format response
    const formattedProduct = {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }

    return createdResponse(formattedProduct, 'Product created successfully')
  } catch (error) {
    console.error('Error creating product:', error)
    return errorResponse('Failed to create product', 500)
  }
}
