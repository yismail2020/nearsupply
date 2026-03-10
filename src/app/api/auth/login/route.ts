/**
 * Login API Route
 *
 * POST /api/auth/login
 * Authenticates a user and creates a session
 */

import { NextRequest } from 'next/server'
import { loginUser } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/utils/response'
import { ZodError, z } from 'zod'

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error)
    }

    const { email, password } = validationResult.data

    // Attempt login
    const result = await loginUser(email, password)

    if (!result.success) {
      return errorResponse(result.error || 'Invalid credentials', 401)
    }

    // Return success with user data
    return successResponse(
      {
        user: result.user,
      },
      'Login successful'
    )
  } catch (error) {
    console.error('Login API error:', error)
    return errorResponse('An error occurred during login', 500)
  }
}
