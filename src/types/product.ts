/**
 * Product Types
 *
 * TypeScript types for Product data structures
 */

// ==================== Enums ====================

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

// ==================== Supplier ====================

export interface ProductSupplier {
  id: string
  name: string | null
  email: string
  company: string | null
  avatar: string | null
}

// ==================== Product ====================

export interface Product {
  id: string
  supplierId: string
  name: string
  description: string | null
  category: string | null
  sku: string | null
  unitPrice: number
  currency: string
  minimumOrderQuantity: number | null
  unit: string | null
  isFeatured: boolean
  status: ProductStatus
  createdAt: string
  updatedAt: string
  supplier: ProductSupplier
}

export interface ProductDetail extends Product {
  canEdit: boolean
  canDelete: boolean
}

// ==================== Form Types ====================

export interface ProductFormData {
  name: string
  description: string
  category: string
  sku: string
  unitPrice: string
  currency: string
  minimumOrderQuantity: string
  unit: string
  isFeatured: boolean
  status: ProductStatus
}

// ==================== Query Types ====================

export interface ProductQueryParams {
  page?: number
  limit?: number
  status?: ProductStatus
  category?: string
  supplierId?: string
  search?: string
  featured?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'unitPrice' | 'category' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// ==================== API Response Types ====================

export interface ProductListResponse {
  success: boolean
  data: {
    data: Product[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export interface ProductResponse {
  success: boolean
  data: ProductDetail
  message?: string
}

export interface ProductCreateResponse {
  success: boolean
  data: Product
  message?: string
}
