/**
 * User Types
 *
 * TypeScript types for User data structures
 */

// ==================== Enums ====================

export type UserRole = 'ADMIN' | 'SUPPLIER' | 'CLIENT'

// ==================== User ====================

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  company: string | null
  phone: string | null
  avatar: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    rfqRequests: number
    proposals: number
    products: number
    uploadedFiles?: number
    notifications?: number
  }
}

export interface UserDetail extends User {
  canEdit: boolean
  canDelete: boolean
}

// ==================== Form Types ====================

export interface UserFormData {
  email: string
  password: string
  name: string
  role: UserRole
  company: string
  phone: string
  avatar: string
  address: string
  isActive: boolean
}

export interface UserEditFormData {
  name: string
  email: string
  role: UserRole
  company: string
  phone: string
  avatar: string
  address: string
  isActive: boolean
}

export interface ProfileFormData {
  name: string
  company: string
  phone: string
  avatar: string
  address: string
}

export interface PasswordChangeFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ==================== Query Types ====================

export interface UserQueryParams {
  page?: number
  limit?: number
  role?: UserRole
  isActive?: boolean
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email' | 'role'
  sortOrder?: 'asc' | 'desc'
}

// ==================== API Response Types ====================

export interface UserListResponse {
  success: boolean
  data: {
    data: User[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export interface UserResponse {
  success: boolean
  data: UserDetail
  message?: string
}

export interface UserCreateResponse {
  success: boolean
  data: User
  message?: string
}

export interface ProfileResponse {
  success: boolean
  data: User & {
    _count: {
      rfqRequests: number
      proposals: number
      products: number
      uploadedFiles: number
      notifications: number
    }
  }
  message?: string
}
