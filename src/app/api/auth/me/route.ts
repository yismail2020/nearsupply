/**
 * Current User API Route
 *
 * GET /api/auth/me
 * Returns the current authenticated user
 */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return unauthorizedResponse('Not authenticated')
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Get current user API error:', error)
    return errorResponse('An error occurred while fetching user', 500)
  }
}
