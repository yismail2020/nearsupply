/**
 * Product API Client
 *
 * Client-side API functions for Product operations
 */

import type {
  Product,
  ProductDetail,
  ProductFormData,
  ProductQueryParams,
  ProductListResponse,
  ProductResponse,
  ProductCreateResponse,
  ProductStatus,
} from '@/types/product'

// ==================== Helper ====================

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred')
  }

  return data
}

// ==================== Query Params Builder ====================

function buildQueryString(params: ProductQueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.status) searchParams.set('status', params.status)
  if (params.category) searchParams.set('category', params.category)
  if (params.supplierId) searchParams.set('supplierId', params.supplierId)
  if (params.search) searchParams.set('search', params.search)
  if (params.featured !== undefined) searchParams.set('featured', params.featured.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ==================== Transform Form Data ====================

function transformFormData(formData: ProductFormData) {
  return {
    name: formData.name,
    description: formData.description || undefined,
    category: formData.category || undefined,
    sku: formData.sku || undefined,
    unitPrice: parseFloat(formData.unitPrice) || 0,
    currency: formData.currency || 'USD',
    minimumOrderQuantity: formData.minimumOrderQuantity ? parseFloat(formData.minimumOrderQuantity) : undefined,
    unit: formData.unit || undefined,
    isFeatured: formData.isFeatured,
    status: formData.status,
  }
}

// ==================== API Functions ====================

/**
 * Get list of products
 */
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
  const queryString = buildQueryString(params)
  const response = await fetch(`/api/products${queryString}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<ProductListResponse>(response)
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<ProductResponse>(response)
}

/**
 * Create new product
 */
export async function createProduct(data: ProductFormData): Promise<ProductCreateResponse> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(transformFormData(data)),
  })

  return handleResponse<ProductCreateResponse>(response)
}

/**
 * Update product
 */
export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<ProductResponse> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(transformFormData(data as ProductFormData)),
  })

  return handleResponse<ProductResponse>(response)
}

/**
 * Delete product
 */
export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete product')
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(id: string, status: ProductStatus): Promise<ProductResponse> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  return handleResponse<ProductResponse>(response)
}
