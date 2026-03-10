'use client'

/**
 * Product Form Component
 *
 * Form for creating and editing products.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, X, Edit } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/api/product'
import { PRODUCT_CATEGORIES } from '@/lib/validators/product'
import { CURRENCIES, UNITS } from '@/lib/utils/helpers'
import type { Product, ProductFormData, ProductStatus } from '@/types/product'

// ==================== Types ====================

interface ProductFormProps {
  product?: Product | null
  editMode?: boolean
  readOnly?: boolean
  onSuccess: () => void
  onCancel: () => void
  onEdit?: () => void
}

// ==================== Initial Form Data ====================

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  sku: '',
  unitPrice: '',
  currency: 'USD',
  minimumOrderQuantity: '',
  unit: '',
  isFeatured: false,
  status: 'ACTIVE',
}

// ==================== Main Component ====================

export function ProductForm({
  product,
  editMode = false,
  readOnly = false,
  onSuccess,
  onCancel,
  onEdit,
}: ProductFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})

  const isSupplier = user?.role === 'SUPPLIER'
  const isAdmin = user?.role === 'ADMIN'
  const canEdit = isSupplier || isAdmin

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        sku: product.sku || '',
        unitPrice: product.unitPrice.toString(),
        currency: product.currency,
        minimumOrderQuantity: product.minimumOrderQuantity?.toString() || '',
        unit: product.unit || '',
        isFeatured: product.isFeatured,
        status: product.status,
      })
    } else {
      setFormData(initialFormData)
    }
    setErrors({})
  }, [product])

  // Handle input change
  const handleChange = (
    field: keyof ProductFormData,
    value: string | boolean | ProductStatus
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Valid unit price is required'
    }

    if (formData.minimumOrderQuantity && parseFloat(formData.minimumOrderQuantity) <= 0) {
      newErrors.minimumOrderQuantity = 'Minimum order quantity must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      if (product) {
        // Update existing product
        await updateProduct(product.id, formData)
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        })
      } else {
        // Create new product
        await createProduct(formData)
        toast({
          title: 'Success',
          description: 'Product created successfully',
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter product name"
              disabled={readOnly}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="Product SKU"
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Product description..."
            rows={3}
            disabled={readOnly}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => handleChange('category', v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice">
              Unit Price <span className="text-destructive">*</span>
            </Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              placeholder="0.00"
              disabled={readOnly}
              className={errors.unitPrice ? 'border-destructive' : ''}
            />
            {errors.unitPrice && (
              <p className="text-sm text-destructive">{errors.unitPrice}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(v) => handleChange('currency', v)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.symbol} {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={formData.unit}
              onValueChange={(v) => handleChange('unit', v)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Minimum Order Quantity */}
        <div className="space-y-2">
          <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity</Label>
          <Input
            id="minimumOrderQuantity"
            type="number"
            min="1"
            value={formData.minimumOrderQuantity}
            onChange={(e) => handleChange('minimumOrderQuantity', e.target.value)}
            placeholder="Optional"
            disabled={readOnly}
            className={errors.minimumOrderQuantity ? 'border-destructive' : ''}
          />
          {errors.minimumOrderQuantity && (
            <p className="text-sm text-destructive">{errors.minimumOrderQuantity}</p>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Settings</h3>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => handleChange('status', v as ProductStatus)}
              disabled={readOnly}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <Switch
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(v) => handleChange('isFeatured', v)}
              disabled={readOnly}
            />
            <Label htmlFor="isFeatured">Featured Product</Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {readOnly ? (
          <>
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
            {canEdit && onEdit && (
              <Button type="button" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {product ? 'Update' : 'Create'} Product
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
