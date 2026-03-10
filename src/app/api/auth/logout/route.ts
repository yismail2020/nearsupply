/**
 * Logout API Route
 *
 * POST /api/auth/logout
 * Clears the session and logs out the user
 */

import { NextRequest } from 'next/server'
import { logoutUser } from '@/lib/utils/auth'
import { successResponse, errorResponse } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    await logoutUser()
    return successResponse(null, 'Logged out successfully')
  } catch (error) {
    console.error('Logout API error:', error)
    return errorResponse('An error occurred during logout', 500)
  }
}
