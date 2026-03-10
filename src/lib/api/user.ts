/**
 * User API Client
 *
 * Client-side API functions for User and Profile operations
 */

import type {
  User,
  UserDetail,
  UserFormData,
  UserEditFormData,
  UserQueryParams,
  UserListResponse,
  UserResponse,
  UserCreateResponse,
  ProfileFormData,
  PasswordChangeFormData,
  ProfileResponse,
  UserRole,
} from '@/types/user'

// ==================== Helper ====================

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred')
  }

  return data
}

// ==================== Query Params Builder ====================

function buildQueryString(params: UserQueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.role) searchParams.set('role', params.role)
  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ==================== User API Functions (Admin) ====================

/**
 * Get list of users (Admin only)
 */
export async function getUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
  const queryString = buildQueryString(params)
  const response = await fetch(`/api/users${queryString}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<UserListResponse>(response)
}

/**
 * Get single user by ID (Admin only)
 */
export async function getUser(id: string): Promise<UserResponse> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<UserResponse>(response)
}

/**
 * Create new user (Admin only)
 */
export async function createUser(data: UserFormData): Promise<UserCreateResponse> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name || undefined,
      role: data.role || 'CLIENT',
      company: data.company || undefined,
      phone: data.phone || undefined,
      avatar: data.avatar || undefined,
      address: data.address || undefined,
      isActive: data.isActive,
    }),
  })

  return handleResponse<UserCreateResponse>(response)
}

/**
 * Update user (Admin only)
 */
export async function updateUser(id: string, data: Partial<UserEditFormData>): Promise<UserResponse> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      role: data.role,
      company: data.company || null,
      phone: data.phone || null,
      avatar: data.avatar || null,
      address: data.address || null,
      isActive: data.isActive,
    }),
  })

  return handleResponse<UserResponse>(response)
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete user')
  }
}

/**
 * Update user status (Admin only)
 */
export async function updateUserStatus(id: string, isActive: boolean): Promise<UserResponse> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ isActive }),
  })

  return handleResponse<UserResponse>(response)
}

// ==================== Profile API Functions ====================

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetch('/api/profile', {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<ProfileResponse>(response)
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: ProfileFormData): Promise<ProfileResponse> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      avatar: data.avatar || null,
      address: data.address || null,
    }),
  })

  return handleResponse<ProfileResponse>(response)
}

/**
 * Change current user's password
 */
export async function changePassword(data: PasswordChangeFormData): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    }),
  })

  return handleResponse<{ success: boolean; message: string }>(response)
}
