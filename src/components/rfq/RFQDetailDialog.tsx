'use client'

/**
 * RFQ Detail Dialog Component
 *
 * Displays full RFQ details with actions like edit, submit, cancel.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Calendar,
  Building2,
  MapPin,
  Package,
  DollarSign,
  Clock,
  Edit,
  Send,
  XCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { getRFQ, submitRFQ, cancelRFQ, reopenRFQ, deleteRFQ } from '@/lib/api/rfq'
import { formatDate, formatDateTime, formatCurrency, getCategoryLabel, RFQ_STATUS_LABELS } from '@/lib/utils/helpers'
import { getUnitLabel } from '@/lib/utils/helpers'
import type { RFQDetail } from '@/types/rfq'
import { CreateRFQForm } from './CreateRFQForm'

// ==================== Types ====================

interface RFQDetailDialogProps {
  rfqId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  onSuccess?: () => void
}

// ==================== Status Badge ====================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string }> = {
    DRAFT: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    SUBMITTED: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    ASSIGNED: { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    QUOTES_RECEIVED: { className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
    UNDER_REVIEW: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    COMPLETED: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    CANCELLED: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  }

  const variant = variants[status] || variants.DRAFT

  return (
    <Badge className={variant.className}>
      {RFQ_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ==================== Info Item Component ====================

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value?: string | null
  className?: string
}) {
  if (!value) return null

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

// ==================== Main Component ====================

export function RFQDetailDialog({
  rfqId,
  open,
  onOpenChange,
  editMode = false,
  onSuccess,
}: RFQDetailDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [rfq, setRFQ] = useState<RFQDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(editMode)
  const [confirmAction, setConfirmAction] = useState<'submit' | 'cancel' | 'delete' | null>(null)

  const isAdmin = user?.role === 'ADMIN'
  const isOwner = rfq?.clientId === user?.id

  // Load RFQ
  useEffect(() => {
    if (rfqId && open) {
      loadRFQ()
    }
  }, [rfqId, open])

  useEffect(() => {
    setIsEditing(editMode)
  }, [editMode])

  const loadRFQ = async () => {
    if (!rfqId) return

    setLoading(true)
    try {
      const response = await getRFQ(rfqId)
      if (response.success && response.data) {
        setRFQ(response.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load RFQ details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Actions
  const handleSubmit = async () => {
    if (!rfq) return

    setActionLoading(true)
    try {
      await submitRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ submitted successfully',
      })
      setConfirmAction(null)
      loadRFQ()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!rfq) return

    setActionLoading(true)
    try {
      await cancelRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ cancelled successfully',
      })
      setConfirmAction(null)
      loadRFQ()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!rfq) return

    setActionLoading(true)
    try {
      await reopenRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ reopened successfully',
      })
      loadRFQ()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reopen RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!rfq) return

    setActionLoading(true)
    try {
      await deleteRFQ(rfq.id)
      toast({
        title: 'Success',
        description: 'RFQ deleted successfully',
      })
      setConfirmAction(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete RFQ',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    loadRFQ()
    onSuccess?.()
  }

  // Render loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Render edit mode
  if (isEditing && rfq) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit RFQ</DialogTitle>
            <DialogDescription>
              {rfq.requestNumber}
            </DialogDescription>
          </DialogHeader>
          <CreateRFQForm
            rfqId={rfq.id}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // Render view mode
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {rfq?.requestNumber}
                  {rfq && <StatusBadge status={rfq.status} />}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {rfq?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {rfq && (
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {rfq.canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {rfq.canSubmit && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setConfirmAction('submit')}
                    disabled={actionLoading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                )}
                {rfq.canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmAction('cancel')}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                {rfq.status === 'CANCELLED' && isAdmin && (
                  <Button variant="outline" size="sm" onClick={handleReopen} disabled={actionLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reopen
                  </Button>
                )}
                {rfq.canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmAction('delete')}
                    disabled={actionLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>

              {/* Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                  icon={Building2}
                  label="Client"
                  value={rfq.client?.company || rfq.client?.name || rfq.client?.email}
                />
                <InfoItem
                  icon={Calendar}
                  label="Deadline"
                  value={rfq.deadlineDate ? formatDate(rfq.deadlineDate) : undefined}
                />
                <InfoItem
                  icon={DollarSign}
                  label="Budget"
                  value={rfq.budget ? formatCurrency(rfq.budget, rfq.currency) : undefined}
                />
                <InfoItem
                  icon={Clock}
                  label="Created"
                  value={formatDateTime(rfq.createdAt)}
                />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="items">
                <TabsList>
                  <TabsTrigger value="items">
                    Items ({rfq.lineItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="proposals">
                    Proposals ({rfq.proposals?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Line Items Tab */}
                <TabsContent value="items" className="mt-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-muted-foreground bg-muted/50">
                      <div className="col-span-5">Item</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Unit</div>
                      <div className="col-span-3 text-center">Links</div>
                    </div>
                    <Separator />
                    {rfq.lineItems.map((item, index) => (
                      <div key={item.id}>
                        <div className="grid grid-cols-12 gap-2 p-3 text-sm items-center">
                          <div className="col-span-5">
                            <p className="font-medium">{item.name}</p>
                            {item.specifications && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.specifications}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2 text-center">{item.quantity}</div>
                          <div className="col-span-2 text-center">
                            {item.unit ? getUnitLabel(item.unit) : '-'}
                          </div>
                          <div className="col-span-3 flex justify-center gap-2">
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            {item.imageUrl && (
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {index < rfq.lineItems.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoItem label="Request Type" value={rfq.requestType} />
                    <InfoItem
                      label="Category"
                      value={rfq.category ? getCategoryLabel(rfq.category) : undefined}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Delivery Date"
                      value={rfq.deliveryDate ? formatDate(rfq.deliveryDate) : undefined}
                    />
                    <InfoItem label="Delivery Terms" value={rfq.deliveryTerms} />
                  </div>

                  {rfq.deliveryAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Delivery Address
                      </p>
                      <p className="font-medium">{rfq.deliveryAddress}</p>
                    </div>
                  )}

                  {rfq.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{rfq.description}</p>
                    </div>
                  )}

                  {rfq.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{rfq.notes}</p>
                    </div>
                  )}

                  {isAdmin && rfq.internalNotes && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground mb-1">Internal Notes (Admin Only)</p>
                      <p className="text-sm whitespace-pre-wrap">{rfq.internalNotes}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Proposals Tab */}
                <TabsContent value="proposals" className="mt-4">
                  {rfq.proposals && rfq.proposals.length > 0 ? (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-muted-foreground bg-muted/50">
                        <div className="col-span-4">Proposal #</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-3">Created</div>
                        <div className="col-span-2"></div>
                      </div>
                      <Separator />
                      {rfq.proposals.map((proposal, index, arr) => (
                        <div key={proposal.id}>
                          <div className="grid grid-cols-12 gap-2 p-3 text-sm items-center">
                            <div className="col-span-4 font-medium">{proposal.proposalNumber}</div>
                            <div className="col-span-3">
                              <Badge variant="outline">{proposal.status}</Badge>
                            </div>
                            <div className="col-span-3 text-muted-foreground">
                              {formatDate(proposal.createdAt)}
                            </div>
                            <div className="col-span-2 text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                          {index < arr.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No proposals received yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-right">
                Last updated: {formatDateTime(rfq.updatedAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <AlertDialog open={confirmAction === 'submit'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit RFQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this RFQ? Once submitted, it will be visible to suppliers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'cancel'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel RFQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this RFQ? This action can be reversed by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel RFQ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'delete'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RFQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this RFQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
