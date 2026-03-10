/**
 * User Single Item API Routes
 *
 * GET /api/users/[id] - Get single user (ADMIN only)
 * PUT /api/users/[id] - Update user (ADMIN only)
 * DELETE /api/users/[id] - Deactivate user (ADMIN only)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/utils/auth'
import { hashPassword } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  noContentResponse,
} from '@/lib/utils/response'
import { adminUpdateUserSchema } from '@/lib/validators/user'

// ==================== Types ====================

interface RouteParams {
  params: Promise<{ id: string }>
}

// ==================== GET /api/users/[id] - Get Single User ====================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN can view user details
    if (!isAdmin(currentUser)) {
      return errorResponse('Only administrators can view user details', 403)
    }

    const { id } = await params

    // Get user
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        avatar: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            rfqRequests: true,
            proposals: true,
            products: true,
            uploadedFiles: true,
            notifications: true,
          },
        },
      },
    })

    if (!user) {
      return notFoundResponse('User not found')
    }

    // Format response
    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    return successResponse(formattedUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return errorResponse('Failed to fetch user', 500)
  }
}

// ==================== PUT /api/users/[id] - Update User ====================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN can update users
    if (!isAdmin(currentUser)) {
      return errorResponse('Only administrators can update users', 403)
    }

    const { id } = await params

    // Get existing user
    const existingUser = await db.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return notFoundResponse('User not found')
    }

    // Parse request body
    const body = await request.json()
    const parsedData = adminUpdateUserSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Check email uniqueness if changing
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })
      if (emailExists) {
        return errorResponse('Email already in use', 409)
      }
    }

    // Prevent admin from deactivating themselves
    if (data.isActive === false && id === currentUser.id) {
      return errorResponse('You cannot deactivate your own account', 400)
    }

    // Prevent the last admin from changing their role
    if (data.role && data.role !== 'ADMIN' && existingUser.role === 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN', isActive: true },
      })
      if (adminCount <= 1) {
        return errorResponse('Cannot remove the last administrator', 400)
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email.toLowerCase()
    if (data.role !== undefined) updateData.role = data.role
    if (data.company !== undefined) updateData.company = data.company
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar !== undefined) updateData.avatar = data.avatar
    if (data.address !== undefined) updateData.address = data.address
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Update user
    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        avatar: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Format response
    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    return successResponse(formattedUser, 'User updated successfully')
  } catch (error) {
    console.error('Error updating user:', error)
    return errorResponse('Failed to update user', 500)
  }
}

// ==================== DELETE /api/users/[id] - Deactivate User ====================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN can deactivate users
    if (!isAdmin(currentUser)) {
      return errorResponse('Only administrators can deactivate users', 403)
    }

    const { id } = await params

    // Prevent self-deactivation
    if (id === currentUser.id) {
      return errorResponse('You cannot deactivate your own account', 400)
    }

    // Get existing user
    const existingUser = await db.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return notFoundResponse('User not found')
    }

    // Prevent deactivating the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN', isActive: true },
      })
      if (adminCount <= 1) {
        return errorResponse('Cannot deactivate the last administrator', 400)
      }
    }

    // Soft delete by deactivating
    await db.user.update({
      where: { id },
      data: { isActive: false },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Error deactivating user:', error)
    return errorResponse('Failed to deactivate user', 500)
  }
}
