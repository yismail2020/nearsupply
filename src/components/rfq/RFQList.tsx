'use client'

/**
 * RFQ List Component
 *
 * Displays a list of RFQs with search, filter, and pagination.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  XCircle,
  Trash2,
  RefreshCw,
  FileText,
  Calendar,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { getRFQs, deleteRFQ, cancelRFQ, submitRFQ, reopenRFQ } from '@/lib/api/rfq'
import { formatDate, formatCurrency, getCategoryLabel, RFQ_STATUS_LABELS } from '@/lib/utils/helpers'
import { RFQ_CATEGORIES, CURRENCIES } from '@/lib/utils/helpers'
import type { RFQ, RFQStatus, RFQQueryParams } from '@/types/rfq'
import { CreateRFQForm } from './CreateRFQForm'
import { RFQDetailDialog } from './RFQDetailDialog'

// ==================== Types ====================

interface RFQListProps {
  onCreateNew?: () => void
  hideCreateButton?: boolean
}

// ==================== Status Badge Component ====================

function StatusBadge({ status }: { status: RFQStatus }) {
  const variants: Record<RFQStatus, { bg: string; text: string }> = {
    DRAFT: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', text: 'Draft' },
    SUBMITTED: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', text: 'Submitted' },
    ASSIGNED: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', text: 'Assigned' },
    QUOTES_RECEIVED: { bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300', text: 'Quotes Received' },
    UNDER_REVIEW: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', text: 'Under Review' },
    COMPLETED: { bg: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', text: 'Completed' },
    CANCELLED: { bg: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', text: 'Cancelled' },
  }

  const variant = variants[status] || variants.DRAFT

  return (
    <Badge variant="outline" className={`${variant.bg} border-0`}>
      {variant.text}
    </Badge>
  )
}

// ==================== Main Component ====================

export function RFQList({ onCreateNew, hideCreateButton = false }: RFQListProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RFQStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Dialogs
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch RFQs
  const fetchRFQs = useCallback(async () => {
    setLoading(true)
    try {
      const params: RFQQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (categoryFilter !== 'all') params.category = categoryFilter

      const response = await getRFQs(params)
      
      if (response.success) {
        setRFQs(response.data.data)
        setTotal(response.data.pagination.total)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load RFQs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, categoryFilter, toast])

  useEffect(() => {
    fetchRFQs()
  }, [fetchRFQs])

  // Handlers
  const handleViewRFQ = (rfq: RFQ) => {
    setSelectedRFQ(rfq)
    setEditMode(false)
    setDetailOpen(true)
  }

  const handleEditRFQ = (rfq: RFQ) => {
    setSelectedRFQ(rfq)
    setEditMode(true)
    setDetailOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedRFQ(null)
    setEditMode(false)
    if (onCreateNew) {
      onCreateNew()
    } else {
      setCreateOpen(true)
    }
  }

  const handleSubmitRFQ = async (rfq: RFQ) => {
    setActionLoading(rfq.id)
    try {
      await submitRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ submitted successfully',
      })
      fetchRFQs()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRFQ = async (rfq: RFQ) => {
    setActionLoading(rfq.id)
    try {
      await cancelRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ cancelled successfully',
      })
      fetchRFQs()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReopenRFQ = async (rfq: RFQ) => {
    setActionLoading(rfq.id)
    try {
      await reopenRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ reopened successfully',
      })
      fetchRFQs()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reopen RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteRFQ = async (rfq: RFQ) => {
    if (!confirm('Are you sure you want to delete this RFQ? This action cannot be undone.')) {
      return
    }

    setActionLoading(rfq.id)
    try {
      await deleteRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ deleted successfully',
      })
      fetchRFQs()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleFormSuccess = () => {
    setCreateOpen(false)
    setDetailOpen(false)
    setSelectedRFQ(null)
    fetchRFQs()
  }

  // Pagination
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RFQ Requests</h2>
          <p className="text-muted-foreground">
            Manage your Requests for Quotation
          </p>
        </div>
        {!hideCreateButton && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New RFQ
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
                placeholder="Search RFQs..."
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
                setStatusFilter(v as RFQStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(RFQ_STATUS_LABELS).map(([value, label]) => (
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
                {RFQ_CATEGORIES.map((cat) => (
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
          ) : rfqs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No RFQs found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first RFQ'}
              </p>
              {!hideCreateButton && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New RFQ
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow
                    key={rfq.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewRFQ(rfq)}
                  >
                    <TableCell className="font-medium">
                      {rfq.requestNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rfq.title}</p>
                        {rfq.client && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {rfq.client.company || rfq.client.name || rfq.client.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rfq.category ? getCategoryLabel(rfq.category) : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rfq.status} />
                    </TableCell>
                    <TableCell>
                      {rfq.deadlineDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(rfq.deadlineDate)}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        {rfq.lineItemsCount || rfq.lineItems?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {rfq.budget ? formatCurrency(rfq.budget, rfq.currency) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {actionLoading === rfq.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleViewRFQ(rfq)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {rfq.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleEditRFQ(rfq)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {rfq.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleSubmitRFQ(rfq)}>
                              <Send className="mr-2 h-4 w-4" />
                              Submit
                            </DropdownMenuItem>
                          )}
                          {['DRAFT', 'SUBMITTED', 'ASSIGNED'].includes(rfq.status) && (
                            <DropdownMenuItem onClick={() => handleCancelRFQ(rfq)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {rfq.status === 'CANCELLED' && user?.role === 'ADMIN' && (
                            <DropdownMenuItem onClick={() => handleReopenRFQ(rfq)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          {['DRAFT', 'CANCELLED'].includes(rfq.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteRFQ(rfq)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create RFQ Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New RFQ</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new Request for Quotation
            </DialogDescription>
          </DialogHeader>
          <CreateRFQForm onSuccess={handleFormSuccess} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* RFQ Detail Dialog */}
      <RFQDetailDialog
        rfqId={selectedRFQ?.id}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        editMode={editMode}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
