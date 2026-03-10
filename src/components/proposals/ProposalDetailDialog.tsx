'use client'

/**
 * Proposal Detail Dialog Component
 *
 * Displays full proposal details with actions.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Building2,
  Calendar,
  Package,
  DollarSign,
  Clock,
  Edit,
  Send,
  XCircle,
  CheckCircle,
  Share2,
  ExternalLink,
  Loader2,
  Paperclip,
  Mail,
  FileText,
} from 'lucide-react'
import { getProposal, submitProposal, acceptProposal, rejectProposal, cancelProposal, shareProposal, updateProposalAdmin, calculateProposalTotals } from '@/lib/api/proposal'
import { formatDate, formatDateTime, formatCurrency, PROPOSAL_STATUS_LABELS } from '@/lib/utils/helpers'
import { getUnitLabel } from '@/lib/utils/helpers'
import type { ProposalDetail, ProposalStatus } from '@/types/proposal'
import { CreateProposalForm } from './CreateProposalForm'

// ==================== Types ====================

interface ProposalDetailDialogProps {
  proposalId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  adminEditMode?: boolean
  onSuccess?: () => void
}

// ==================== Status Badge ====================

function StatusBadge({ status }: { status: ProposalStatus }) {
  const variants: Record<ProposalStatus, { className: string }> = {
    DRAFT: { className: 'bg-gray-100 text-gray-700' },
    SUBMITTED: { className: 'bg-blue-100 text-blue-700' },
    UNDER_REVIEW: { className: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { className: 'bg-green-100 text-green-700' },
    REJECTED: { className: 'bg-red-100 text-red-700' },
    CANCELLED: { className: 'bg-gray-100 text-gray-500' },
  }

  const variant = variants[status] || variants.DRAFT

  return (
    <Badge className={variant.className}>
      {PROPOSAL_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ==================== Info Item ====================

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon?: React.ComponentType<{ className?: string }>
}) {
  if (!value) return null

  return (
    <div>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

// ==================== Main Component ====================

export function ProposalDetailDialog({
  proposalId,
  open,
  onOpenChange,
  editMode = false,
  adminEditMode = false,
  onSuccess,
}: ProposalDetailDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [proposal, setProposal] = useState<ProposalDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(editMode)
  const [isAdminEditing, setIsAdminEditing] = useState(adminEditMode)
  const [confirmAction, setConfirmAction] = useState<'submit' | 'accept' | 'reject' | 'cancel' | null>(null)

  // Admin edit form
  const [adminForm, setAdminForm] = useState({
    adminMargin: '',
    shippingCost: '',
    taxPercentage: '',
    termsConditions: '',
    status: '' as ProposalStatus | '',
  })

  const isAdmin = user?.role === 'ADMIN'
  const isSupplier = user?.role === 'SUPPLIER'

  // Load proposal
  useEffect(() => {
    if (proposalId && open) {
      loadProposal()
    }
  }, [proposalId, open])

  useEffect(() => {
    setIsEditing(editMode)
    setIsAdminEditing(adminEditMode)
  }, [editMode, adminEditMode])

  const loadProposal = async () => {
    if (!proposalId) return

    setLoading(true)
    try {
      const response = await getProposal(proposalId)
      if (response.success && response.data) {
        setProposal(response.data)
        setAdminForm({
          adminMargin: response.data.adminMargin?.toString() || '',
          shippingCost: response.data.shippingCost?.toString() || '',
          taxPercentage: response.data.taxPercentage?.toString() || '',
          termsConditions: response.data.termsConditions || '',
          status: response.data.status,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load proposal details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Actions
  const handleSubmit = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await submitProposal(proposal.id)
      toast({ title: 'Success', description: 'Proposal submitted successfully' })
      setConfirmAction(null)
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await acceptProposal(proposal.id)
      toast({ title: 'Success', description: 'Proposal accepted' })
      setConfirmAction(null)
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await rejectProposal(proposal.id)
      toast({ title: 'Success', description: 'Proposal rejected' })
      setConfirmAction(null)
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await cancelProposal(proposal.id)
      toast({ title: 'Success', description: 'Proposal cancelled' })
      setConfirmAction(null)
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleShare = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await shareProposal(proposal.id)
      toast({ title: 'Success', description: 'Proposal shared with client' })
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdminSave = async () => {
    if (!proposal) return

    setActionLoading(true)
    try {
      await updateProposalAdmin(proposal.id, {
        adminMargin: adminForm.adminMargin,
        shippingCost: adminForm.shippingCost,
        taxPercentage: adminForm.taxPercentage,
        termsConditions: adminForm.termsConditions,
        status: adminForm.status as ProposalStatus || undefined,
      })
      toast({ title: 'Success', description: 'Proposal updated' })
      setIsAdminEditing(false)
      loadProposal()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update proposal',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    loadProposal()
    onSuccess?.()
  }

  // Loading state
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

  // Edit mode
  if (isEditing && proposal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Proposal</DialogTitle>
            <DialogDescription>{proposal.proposalNumber}</DialogDescription>
          </DialogHeader>
          <CreateProposalForm
            proposalId={proposal.id}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // View mode
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {proposal?.proposalNumber}
                  {proposal && <StatusBadge status={proposal.status} />}
                  {proposal?.isShared && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <Share2 className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {proposal?.rfqRequest?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {proposal && (
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {/* Supplier actions */}
                {proposal.canEdit && isSupplier && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {proposal.canSubmit && isSupplier && (
                  <Button size="sm" onClick={() => setConfirmAction('submit')} disabled={actionLoading}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                )}

                {/* Admin actions */}
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setIsAdminEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Commercial
                  </Button>
                )}
                {proposal.canAccept && isAdmin && (
                  <Button size="sm" onClick={() => setConfirmAction('accept')} disabled={actionLoading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                )}
                {proposal.canReject && isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction('reject')} disabled={actionLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                )}
                {proposal.canShare && isAdmin && (
                  <Button variant="outline" size="sm" onClick={handleShare} disabled={actionLoading}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share with Client
                  </Button>
                )}

                {/* Cancel action */}
                {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) && (
                  <Button variant="outline" size="sm" onClick={() => setConfirmAction('cancel')} disabled={actionLoading}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>

              {/* Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoItem icon={Building2} label="Supplier" value={proposal.supplier?.company || proposal.supplier?.name || proposal.supplier?.email} />
                <InfoItem icon={FileText} label="RFQ" value={proposal.rfqRequest?.requestNumber} />
                <InfoItem icon={DollarSign} label="Total" value={formatCurrency(proposal.grandTotal, proposal.currency)} />
                <InfoItem icon={Clock} label="Created" value={formatDateTime(proposal.createdAt)} />
              </div>

              <Tabs defaultValue="items">
                <TabsList>
                  <TabsTrigger value="items">Line Items ({proposal.lineItems?.length || 0})</TabsTrigger>
                  <TabsTrigger value="commercial">Commercial</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments ({proposal.attachments?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Line Items Tab */}
                <TabsContent value="items" className="mt-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-muted-foreground bg-muted/50">
                      <div className="col-span-4">Item</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-2"></div>
                    </div>
                    <Separator />
                    {proposal.lineItems?.map((item, index) => (
                      <div key={index}>
                        <div className="grid grid-cols-12 gap-2 p-3 text-sm items-center">
                          <div className="col-span-4">
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            {item.quantity} {item.unit ? getUnitLabel(item.unit) : ''}
                          </div>
                          <div className="col-span-2 text-right">
                            {formatCurrency(item.unitPrice, proposal.currency)}
                          </div>
                          <div className="col-span-2 text-right font-medium">
                            {formatCurrency(item.totalPrice, proposal.currency)}
                          </div>
                        </div>
                        {index < (proposal.lineItems?.length || 0) - 1 && <Separator />}
                      </div>
                    ))}
                    <Separator />
                    <div className="p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(proposal.subtotal, proposal.currency)}</span>
                      </div>
                      {proposal.adminMargin > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin Margin</span>
                          <span>{formatCurrency(proposal.adminMargin, proposal.currency)}</span>
                        </div>
                      )}
                      {proposal.shippingCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatCurrency(proposal.shippingCost, proposal.currency)}</span>
                        </div>
                      )}
                      {proposal.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax ({proposal.taxPercentage}%)</span>
                          <span>{formatCurrency(proposal.taxAmount, proposal.currency)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium text-base">
                        <span>Grand Total</span>
                        <span>{formatCurrency(proposal.grandTotal, proposal.currency)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Commercial Tab */}
                <TabsContent value="commercial" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoItem label="Subtotal" value={formatCurrency(proposal.subtotal, proposal.currency)} />
                    <InfoItem label="Admin Margin" value={proposal.adminMargin ? formatCurrency(proposal.adminMargin, proposal.currency) : '-'} />
                    <InfoItem label="Shipping Cost" value={proposal.shippingCost ? formatCurrency(proposal.shippingCost, proposal.currency) : '-'} />
                    <InfoItem label="Tax" value={proposal.taxPercentage ? `${proposal.taxPercentage}% (${formatCurrency(proposal.taxAmount, proposal.currency)})` : '-'} />
                    <InfoItem label="Validity" value={proposal.validity ? `${proposal.validity} days` : '-'} />
                    <InfoItem label="Grand Total" value={formatCurrency(proposal.grandTotal, proposal.currency)} />
                  </div>
                  {proposal.termsConditions && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-1">Terms & Conditions</p>
                      <p className="text-sm whitespace-pre-wrap">{proposal.termsConditions}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoItem label="Delivery Terms" value={proposal.deliveryTerms} />
                    <InfoItem label="Validity Period" value={proposal.validity ? `${proposal.validity} days` : undefined} />
                  </div>
                  {proposal.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-4">
                  {proposal.attachments?.length > 0 ? (
                    <div className="space-y-2">
                      {proposal.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted/50 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">{url.split('/').pop()}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No attachments</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Share Info */}
              {proposal.isShared && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm">
                  <p className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Share2 className="h-4 w-4" />
                    Shared with client on {formatDateTime(proposal.sharedAt)}
                  </p>
                  {proposal.emailSentTo?.length > 0 && (
                    <p className="flex items-center gap-2 text-green-600 dark:text-green-500 mt-1 ml-6">
                      <Mail className="h-3 w-3" />
                      Sent to: {proposal.emailSentTo.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-xs text-muted-foreground text-right">
                Last updated: {formatDateTime(proposal.updatedAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <AlertDialog open={confirmAction === 'submit'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this proposal? Once submitted, it will be sent for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'accept'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this proposal? This will mark the RFQ as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'reject'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this proposal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'cancel'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this proposal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel Proposal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
