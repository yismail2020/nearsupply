import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RFQ_STATUS_LABELS, PROPOSAL_STATUS_LABELS, PRODUCT_STATUS_LABELS } from '@/lib/utils/helpers'
import type { RFQStatus, ProposalStatus, ProductStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: RFQStatus | ProposalStatus | ProductStatus
  type: 'rfq' | 'proposal' | 'product'
}

const rfqStatusColors: Record<RFQStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ASSIGNED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  QUOTES_RECEIVED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  UNDER_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const proposalStatusColors: Record<ProposalStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  UNDER_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const productStatusColors: Record<ProductStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let label: string
  let colorClass: string

  if (type === 'rfq') {
    label = RFQ_STATUS_LABELS[status as RFQStatus]
    colorClass = rfqStatusColors[status as RFQStatus]
  } else if (type === 'proposal') {
    label = PROPOSAL_STATUS_LABELS[status as ProposalStatus]
    colorClass = proposalStatusColors[status as ProposalStatus]
  } else {
    label = PRODUCT_STATUS_LABELS[status as ProductStatus]
    colorClass = productStatusColors[status as ProductStatus]
  }

  return (
    <Badge variant="outline" className={cn('font-medium', colorClass)}>
      {label}
    </Badge>
  )
}
