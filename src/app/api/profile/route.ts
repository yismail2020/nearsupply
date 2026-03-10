/**
 * Profile API Routes
 *
 * GET /api/profile - Get current user's profile
 * PUT /api/profile - Update current user's profile
 * POST /api/profile - Change password
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/response'
import { profileUpdateSchema, passwordChangeSchema } from '@/lib/validators/user'

// ==================== GET /api/profile - Get Profile ====================

export async function GET() {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Get full user profile
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
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
            notifications: { where: { isRead: false } },
          },
        },
      },
    })

    if (!user) {
      return unauthorizedResponse()
    }

    // Format response
    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    return successResponse(formattedUser)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return errorResponse('Failed to fetch profile', 500)
  }
}

// ==================== PUT /api/profile - Update Profile ====================

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Parse request body
    const body = await request.json()
    const parsedData = profileUpdateSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.company !== undefined) updateData.company = data.company
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null
    if (data.address !== undefined) updateData.address = data.address

    // Update user
    const user = await db.user.update({
      where: { id: currentUser.id },
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

    return successResponse(formattedUser, 'Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
    return errorResponse('Failed to update profile', 500)
  }
}

// ==================== POST /api/profile - Change Password ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Parse request body
    const body = await request.json()

    // Check if this is a password change request
    if (body.currentPassword || body.newPassword) {
      const parsedData = passwordChangeSchema.safeParse(body)

      if (!parsedData.success) {
        return validationErrorResponse(parsedData.error)
      }

      const { currentPassword, newPassword } = parsedData.data

      // Get user with password
      const user = await db.user.findUnique({
        where: { id: currentUser.id },
        select: { id: true, password: true },
      })

      if (!user) {
        return unauthorizedResponse()
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, user.password)
      if (!isValid) {
        return errorResponse('Current password is incorrect', 400)
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword)

      // Update password
      await db.user.update({
        where: { id: currentUser.id },
        data: { password: hashedPassword },
      })

      return successResponse({ message: 'Password changed successfully' })
    }

    return errorResponse('Invalid request', 400)
  } catch (error) {
    console.error('Error changing password:', error)
    return errorResponse('Failed to change password', 500)
  }
}
