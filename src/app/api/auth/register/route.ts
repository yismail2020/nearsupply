/**
 * Register API Route
 *
 * POST /api/auth/register
 * Creates a new user account
 */

import { NextRequest } from 'next/server'
import { registerUser } from '@/lib/utils/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/response'
import { z } from 'zod'

// Validation schema
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  company: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  role: z
    .enum(['CLIENT', 'SUPPLIER'])
    .default('CLIENT'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error)
    }

    const { email, password, name, company, role } = validationResult.data

    // Register user
    const result = await registerUser({
      email,
      password,
      name,
      company,
      role,
    })

    if (!result.success) {
      return errorResponse(result.error || 'Registration failed')
    }

    // Return success with user data
    return successResponse(
      {
        user: result.user,
      },
      'Account created successfully',
      201
    )
  } catch (error) {
    console.error('Register API error:', error)
    return errorResponse('An error occurred during registration', 500)
  }
}
