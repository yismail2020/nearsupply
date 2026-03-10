'use client'

/**
 * Products List Component
 *
 * Displays a list of products with search, filter, and CRUD operations.
 * Role-based: Suppliers manage their own products, Admin sees all, Clients browse active products.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Tag,
} from 'lucide-react'
import { getProducts, deleteProduct, updateProductStatus } from '@/lib/api/product'
import { formatDate, formatCurrency, PRODUCT_STATUS_LABELS } from '@/lib/utils/helpers'
import { PRODUCT_CATEGORIES } from '@/lib/validators/product'
import type { Product, ProductStatus, ProductQueryParams, ProductFormData } from '@/types/product'
import { ProductForm } from './ProductForm'

// ==================== Types ====================

interface ProductsListProps {
  supplierId?: string
  hideCreateButton?: boolean
}

// ==================== Status Badge Component ====================

function StatusBadge({ status }: { status: ProductStatus }) {
  const variants: Record<ProductStatus, { className: string }> = {
    ACTIVE: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    INACTIVE: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  }

  const variant = variants[status] || variants.ACTIVE

  return (
    <Badge variant="outline" className={`${variant.className} border-0`}>
      {PRODUCT_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ==================== Main Component ====================

export function ProductsList({ supplierId, hideCreateButton = false }: ProductsListProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isSupplier = user?.role === 'SUPPLIER'
  const canCreate = isSupplier || isAdmin
  const canEdit = isSupplier || isAdmin

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: ProductQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (supplierId) params.supplierId = supplierId

      const response = await getProducts(params)

      if (response.success) {
        setProducts(response.data.data)
        setTotal(response.data.pagination.total)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, categoryFilter, supplierId, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handlers
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditMode(false)
    setFormOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditMode(true)
    setFormOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setEditMode(false)
    setFormOpen(true)
  }

  const handleToggleStatus = async (product: Product) => {
    setActionLoading(product.id)
    try {
      const newStatus: ProductStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await updateProductStatus(product.id, newStatus)
      toast({
        title: 'Success',
        description: `Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`,
      })
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product status',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setActionLoading(product.id)
    try {
      await deleteProduct(product.id)
      toast({
        title: 'Success',
        description: 'Product deleted',
      })
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setSelectedProduct(null)
    fetchProducts()
  }

  // Get category label
  const getCategoryLabel = (value: string | null) => {
    if (!value) return '-'
    const category = PRODUCT_CATEGORIES.find(c => c.value === value)
    return category?.label || value
  }

  // Pagination
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            {isSupplier ? 'Manage your product catalog' : isAdmin ? 'View all products' : 'Browse available products'}
          </p>
        </div>
        {canCreate && !hideCreateButton && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ProductStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : canCreate
                    ? 'Get started by creating your first product'
                    : 'No products available'}
              </p>
              {canCreate && !hideCreateButton && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewProduct(product)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {getCategoryLabel(product.category)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatCurrency(product.unitPrice, product.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {actionLoading === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                              {product.status === 'ACTIVE' ? (
                                <>
                                  <Package className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Package className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Product' : selectedProduct ? 'Product Details' : 'New Product'}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Update product information'
                : selectedProduct
                  ? 'View product details'
                  : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={selectedProduct}
            editMode={editMode}
            readOnly={!editMode && !!selectedProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
            onEdit={() => setEditMode(true)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
