'use client'

/**
 * Proposals List Component
 *
 * Displays a list of proposals with role-based filtering and actions.
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
  Send,
  CheckCircle,
  XCircle,
  Share2,
  FileText,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
  Paperclip,
} from 'lucide-react'
import { getProposals, deleteProposal, submitProposal, acceptProposal, rejectProposal, cancelProposal, shareProposal, unshareProposal } from '@/lib/api/proposal'
import { formatDate, formatCurrency, PROPOSAL_STATUS_LABELS } from '@/lib/utils/helpers'
import type { Proposal, ProposalStatus, ProposalQueryParams } from '@/types/proposal'
import { ProposalDetailDialog } from './ProposalDetailDialog'
import { CreateProposalForm } from './CreateProposalForm'

// ==================== Types ====================

interface ProposalsListProps {
  rfqId?: string
  hideCreateButton?: boolean
}

// ==================== Status Badge Component ====================

function StatusBadge({ status }: { status: ProposalStatus }) {
  const variants: Record<ProposalStatus, { className: string }> = {
    DRAFT: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    SUBMITTED: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    UNDER_REVIEW: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    ACCEPTED: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    CANCELLED: { className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  }

  const variant = variants[status] || variants.DRAFT

  return (
    <Badge variant="outline" className={`${variant.className} border-0`}>
      {PROPOSAL_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ==================== Main Component ====================

export function ProposalsList({ rfqId, hideCreateButton = false }: ProposalsListProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')

  // Dialogs
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [adminEditMode, setAdminEditMode] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isSupplier = user?.role === 'SUPPLIER'

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const params: ProposalQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (rfqId) params.rfqRequestId = rfqId

      const response = await getProposals(params)

      if (response.success) {
        setProposals(response.data.data)
        setTotal(response.data.pagination.total)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load proposals',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, rfqId, toast])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Handlers
  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setEditMode(false)
    setAdminEditMode(false)
    setDetailOpen(true)
  }

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setEditMode(true)
    setAdminEditMode(false)
    setDetailOpen(true)
  }

  const handleAdminEdit = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setEditMode(false)
    setAdminEditMode(true)
    setDetailOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedProposal(null)
    setEditMode(false)
    setAdminEditMode(false)
    setCreateOpen(true)
  }

  const handleSubmit = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await submitProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal submitted successfully',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAccept = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await acceptProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal accepted successfully',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await rejectProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal rejected',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await cancelProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal cancelled',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleShare = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await shareProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal shared with client',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnshare = async (proposal: Proposal) => {
    setActionLoading(proposal.id)
    try {
      await unshareProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal unshared',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unshare proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (proposal: Proposal) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return

    setActionLoading(proposal.id)
    try {
      await deleteProposal(proposal.id)
      toast({
        title: 'Success',
        description: 'Proposal deleted',
      })
      fetchProposals()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleFormSuccess = () => {
    setCreateOpen(false)
    setDetailOpen(false)
    setSelectedProposal(null)
    fetchProposals()
  }

  // Pagination
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proposals</h2>
          <p className="text-muted-foreground">
            {isSupplier ? 'Manage your proposals' : isAdmin ? 'Review and manage all proposals' : 'View proposals for your RFQs'}
          </p>
        </div>
        {isSupplier && !hideCreateButton && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
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
                placeholder="Search proposals..."
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
                setStatusFilter(v as ProposalStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
          ) : proposals.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No proposals found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : isSupplier
                    ? 'Get started by creating your first proposal'
                    : 'No proposals available'}
              </p>
              {isSupplier && !hideCreateButton && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Proposal
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal #</TableHead>
                  <TableHead>RFQ</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Shared</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewProposal(proposal)}
                  >
                    <TableCell className="font-medium">
                      {proposal.proposalNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">
                          {proposal.rfqRequest.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {proposal.rfqRequest.requestNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">
                          {proposal.supplier.company || proposal.supplier.name || proposal.supplier.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={proposal.status} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(proposal.grandTotal, proposal.currency)}
                    </TableCell>
                    <TableCell>
                      {proposal.isShared ? (
                        <div className="flex items-center gap-1">
                          <Share2 className="h-4 w-4 text-green-500" />
                          {proposal.emailSentTo?.length > 0 && (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(proposal.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {proposal.attachments?.length > 0 && (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {actionLoading === proposal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleViewProposal(proposal)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            {/* Supplier actions */}
                            {isSupplier && proposal.supplierId === user?.id && proposal.status === 'DRAFT' && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditProposal(proposal)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSubmit(proposal)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Submit
                                </DropdownMenuItem>
                              </>
                            )}

                            {isSupplier && proposal.supplierId === user?.id && proposal.status === 'DRAFT' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(proposal)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Admin actions */}
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => handleAdminEdit(proposal)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Commercial
                                </DropdownMenuItem>

                                {['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleAccept(proposal)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Accept
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReject(proposal)}>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {proposal.status === 'ACCEPTED' && !proposal.isShared && (
                                  <DropdownMenuItem onClick={() => handleShare(proposal)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share with Client
                                  </DropdownMenuItem>
                                )}

                                {proposal.status === 'ACCEPTED' && proposal.isShared && (
                                  <DropdownMenuItem onClick={() => handleUnshare(proposal)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Unshare
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}

                            {/* Cancel action */}
                            {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) && (
                              <DropdownMenuItem onClick={() => handleCancel(proposal)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      {/* Create Proposal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Submit a proposal for an open RFQ
            </DialogDescription>
          </DialogHeader>
          <CreateProposalForm onSuccess={handleFormSuccess} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Proposal Detail Dialog */}
      <ProposalDetailDialog
        proposalId={selectedProposal?.id}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        editMode={editMode}
        adminEditMode={adminEditMode}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
