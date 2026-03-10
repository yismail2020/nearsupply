/**
 * Product Single Item API Routes
 *
 * GET /api/products/[id] - Get single product
 * PUT /api/products/[id] - Update product (owner or admin)
 * DELETE /api/products/[id] - Delete product (owner or admin)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin, isSupplier } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  noContentResponse,
} from '@/lib/utils/response'
import { updateProductSchema } from '@/lib/validators/product'

// ==================== Types ====================

interface RouteParams {
  params: Promise<{ id: string }>
}

// ==================== Helper Functions ====================

/**
 * Check if user can modify product
 */
function canModifyProduct(
  user: { id: string; role: string },
  product: { supplierId: string }
): boolean {
  if (isAdmin(user)) return true
  if (isSupplier(user) && product.supplierId === user.id) return true
  return false
}

// ==================== GET /api/products/[id] - Get Single Product ====================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get product
    const product = await db.product.findUnique({
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
      },
    })

    if (!product) {
      return notFoundResponse('Product not found')
    }

    // Clients can only see ACTIVE products
    if (!isAdmin(currentUser) && !isSupplier(currentUser)) {
      if (product.status !== 'ACTIVE') {
        return notFoundResponse('Product not found')
      }
    }

    // Suppliers can only see their own products (unless they're viewing for purchase)
    if (isSupplier(currentUser) && product.supplierId !== currentUser.id) {
      if (product.status !== 'ACTIVE') {
        return notFoundResponse('Product not found')
      }
    }

    // Format response
    const formattedProduct = {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      canEdit: canModifyProduct(currentUser, product),
      canDelete: canModifyProduct(currentUser, product),
    }

    return successResponse(formattedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return errorResponse('Failed to fetch product', 500)
  }
}

// ==================== PUT /api/products/[id] - Update Product ====================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing product
    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return notFoundResponse('Product not found')
    }

    // Check permission
    if (!canModifyProduct(currentUser, existingProduct)) {
      return errorResponse('You do not have permission to update this product', 403)
    }

    // Parse request body
    const body = await request.json()
    const parsedData = updateProductSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.minimumOrderQuantity !== undefined) {
      updateData.minimumOrderQuantity = data.minimumOrderQuantity
    }
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.isFeatured !== undefined) {
      // Only admin can set featured flag
      if (!isAdmin(currentUser)) {
        return errorResponse('Only administrators can set the featured flag', 403)
      }
      updateData.isFeatured = data.isFeatured
    }
    if (data.status !== undefined) updateData.status = data.status

    // Update product
    const product = await db.product.update({
      where: { id },
      data: updateData,
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

    return successResponse(formattedProduct, 'Product updated successfully')
  } catch (error) {
    console.error('Error updating product:', error)
    return errorResponse('Failed to update product', 500)
  }
}

// ==================== DELETE /api/products/[id] - Delete Product ====================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Get existing product
    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return notFoundResponse('Product not found')
    }

    // Check permission
    if (!canModifyProduct(currentUser, existingProduct)) {
      return errorResponse('You do not have permission to delete this product', 403)
    }

    // Soft delete by setting status to INACTIVE instead of hard delete
    // This preserves referential integrity if product was used in proposals
    await db.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Error deleting product:', error)
    return errorResponse('Failed to delete product', 500)
  }
}
