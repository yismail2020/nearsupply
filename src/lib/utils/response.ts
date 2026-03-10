/**
 * API Response Utilities
 *
 * Standardized response helpers for Next.js API Routes
 * Ensures consistent response format across all endpoints
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// ==================== Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Array<{ field: string; message: string }>
}

export interface PaginatedData<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// ==================== Success Responses ====================

/**
 * Send a success response with data
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Send a created response (201)
 */
export function createdResponse<T>(
  data: T,
  message: string = 'Resource created successfully'
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201)
}

/**
 * Send a no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * Send a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiResponse<PaginatedData<T>>> {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return successResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  })
}

// ==================== Error Responses ====================

/**
 * Send an error response
 */
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  )
}

/**
 * Send a validation error response from ZodError
 */
export function validationErrorResponse(
  error: ZodError
): NextResponse<ApiResponse> {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 400 }
  )
}

/**
 * Send a validation error response from custom errors
 */
export function validationErrorsResponse(
  errors: Array<{ field: string; message: string }>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 400 }
  )
}

// ==================== Auth Error Responses ====================

/**
 * Send an unauthorized response (401)
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401)
}

/**
 * Send a forbidden response (403)
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403)
}

// ==================== Resource Error Responses ====================

/**
 * Send a not found response (404)
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404)
}

/**
 * Send a conflict response (409)
 */
export function conflictResponse(
  message: string = 'Resource already exists'
): NextResponse<ApiResponse> {
  return errorResponse(message, 409)
}

// ==================== Server Error Response ====================

/**
 * Send a server error response (500)
 */
export function serverErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiResponse> {
  return errorResponse(message, 500)
}

// ==================== Utility Functions ====================

/**
 * Parse pagination parameters from URL search params
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number
  limit: number
  skip: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Parse sort parameters from URL search params
 */
export function parseSort(
  searchParams: URLSearchParams,
  defaultSortBy: string = 'createdAt',
  defaultSortOrder: 'asc' | 'desc' = 'desc'
): {
  sortBy: string
  sortOrder: 'asc' | 'desc'
} {
  const sortBy = searchParams.get('sortBy') || defaultSortBy
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultSortOrder

  return { sortBy, sortOrder }
}

/**
 * Build where clause for search
 */
export function buildSearchWhere(
  search: string,
  fields: string[]
): Record<string, unknown> | undefined {
  if (!search || fields.length === 0) return undefined

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search },
    })),
  }
}
