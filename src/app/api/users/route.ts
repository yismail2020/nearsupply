/**
 * Users API Routes
 *
 * GET /api/users - List users (ADMIN only)
 * POST /api/users - Create new user (ADMIN only)
 */

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/utils/auth'
import { hashPassword } from '@/lib/utils/auth'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  paginatedResponse,
} from '@/lib/utils/response'
import { userQuerySchema, adminCreateUserSchema } from '@/lib/validators/user'

// ==================== GET /api/users - List Users ====================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN can list users
    if (!isAdmin(currentUser)) {
      return errorResponse('Only administrators can view users', 403)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const parsedQuery = userQuerySchema.safeParse(queryParams)

    if (!parsedQuery.success) {
      return validationErrorResponse(parsedQuery.error)
    }

    const { page, limit, role, isActive, search, sortBy, sortOrder } = parsedQuery.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }

    // Build orderBy
    const orderBy: Record<string, unknown> = {}
    orderBy[sortBy] = sortOrder

    // Get total count
    const total = await db.user.count({ where })

    // Get users (exclude password)
    const users = await db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
          },
        },
      },
    })

    // Format response
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return paginatedResponse(formattedUsers, page, limit, total)
  } catch (error) {
    console.error('Error fetching users:', error)
    return errorResponse('Failed to fetch users', 500)
  }
}

// ==================== POST /api/users - Create User (Admin) ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return unauthorizedResponse()
    }

    // Only ADMIN can create users
    if (!isAdmin(currentUser)) {
      return errorResponse('Only administrators can create users', 403)
    }

    // Parse request body
    const body = await request.json()
    const parsedData = adminCreateUserSchema.safeParse(body)

    if (!parsedData.success) {
      return validationErrorResponse(parsedData.error)
    }

    const data = parsedData.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingUser) {
      return errorResponse('User with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: data.role,
        company: data.company,
        phone: data.phone,
        avatar: data.avatar,
        address: data.address,
        isActive: data.isActive,
      },
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

    return createdResponse(formattedUser, 'User created successfully')
  } catch (error) {
    console.error('Error creating user:', error)
    return errorResponse('Failed to create user', 500)
  }
}
