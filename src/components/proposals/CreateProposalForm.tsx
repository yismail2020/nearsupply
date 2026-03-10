'use client'

/**
 * Create Proposal Form Component
 *
 * Form for creating and editing proposals with line items.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Trash2,
  Loader2,
  Calculator,
} from 'lucide-react'
import { createProposal, updateProposal, getProposal, calculateLineItemTotal, calculateSubtotal, calculateProposalTotals } from '@/lib/api/proposal'
import { CURRENCIES, UNITS } from '@/lib/utils/helpers'
import { getUnitLabel } from '@/lib/utils/helpers'
import type { ProposalLineItem, RFQSummary } from '@/types/proposal'
import { getRFQ } from '@/lib/api/rfq'

// ==================== Types ====================

interface CreateProposalFormProps {
  proposalId?: string
  rfqId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface LineItem extends ProposalLineItem {
  id: string
}

// ==================== Default Values ====================

const defaultLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 0,
  totalPrice: 0,
})

// ==================== Component ====================

export function CreateProposalForm({ proposalId, rfqId, onSuccess, onCancel }: CreateProposalFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!!proposalId)
  const [rfq, setRFQ] = useState<RFQSummary | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([defaultLineItem()])
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [validity, setValidity] = useState('30')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!proposalId

  // Load existing proposal
  useEffect(() => {
    if (proposalId) {
      loadProposal(proposalId)
    } else if (rfqId) {
      loadRFQ(rfqId)
    }
  }, [proposalId, rfqId])

  const loadProposal = async (id: string) => {
    try {
      setInitialLoading(true)
      const response = await getProposal(id)

      if (response.success && response.data) {
        const proposal = response.data
        setRFQ(proposal.rfqRequest)
        setCurrency(proposal.currency)
        setNotes(proposal.notes || '')
        setDeliveryTerms(proposal.deliveryTerms || '')
        setValidity(proposal.validity?.toString() || '30')
        setLineItems(proposal.lineItems.map(item => ({
          ...item,
          id: crypto.randomUUID(),
        })))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load proposal data',
        variant: 'destructive',
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const loadRFQ = async (id: string) => {
    try {
      setInitialLoading(true)
      const response = await getRFQ(id)

      if (response.success && response.data) {
        setRFQ(response.data as unknown as RFQSummary)
        setCurrency(response.data.currency || 'USD')

        // Pre-populate line items from RFQ
        if (response.data.lineItems?.length > 0) {
          setLineItems(response.data.lineItems.map(item => ({
            id: crypto.randomUUID(),
            rfqItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            unitPrice: 0,
            totalPrice: 0,
          })))
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load RFQ data',
        variant: 'destructive',
      })
    } finally {
      setInitialLoading(false)
    }
  }

  // Line item handlers
  const addLineItem = () => {
    setLineItems(prev => [...prev, defaultLineItem()])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) {
      toast({
        title: 'Cannot Remove',
        description: 'At least one line item is required',
        variant: 'destructive',
      })
      return
    }
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item

      const updated = { ...item, [field]: value }

      // Recalculate total when quantity or unitPrice changes
      if (field === 'quantity' || field === 'unitPrice') {
        updated.totalPrice = calculateLineItemTotal(
          field === 'quantity' ? Number(value) : item.quantity,
          field === 'unitPrice' ? Number(value) : item.unitPrice
        )
      }

      return updated
    }))
  }

  // Calculate totals
  const subtotal = calculateSubtotal(lineItems)

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!rfq?.id && !proposalId) {
      newErrors.rfq = 'RFQ is required'
    }

    if (lineItems.some(item => !item.name.trim())) {
      newErrors.lineItems = 'All items must have a name'
    }

    if (lineItems.some(item => item.quantity <= 0)) {
      newErrors.quantity = 'All quantities must be positive'
    }

    if (lineItems.some(item => item.unitPrice < 0)) {
      newErrors.unitPrice = 'Unit prices cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const data = {
        rfqRequestId: rfq?.id || '',
        lineItems: lineItems.map(item => ({
          rfqItemId: item.rfqItemId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
        })),
        subtotal,
        currency,
        notes,
        deliveryTerms,
        validity,
        attachments: [],
      }

      if (isEditMode && proposalId) {
        await updateProposal(proposalId, data)
        toast({ title: 'Success', description: 'Proposal updated successfully' })
      } else {
        await createProposal(data)
        toast({ title: 'Success', description: 'Proposal created successfully' })
      }

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save proposal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* RFQ Info */}
      {rfq && (
        <Card>
          <CardHeader>
            <CardTitle>RFQ Information</CardTitle>
            <CardDescription>
              {rfq.requestNumber} - {rfq.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{rfq.client?.company || rfq.client?.name || rfq.client?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{rfq.deadlineDate ? new Date(rfq.deadlineDate).toLocaleDateString() : 'No deadline'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{rfq.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            Add pricing for each item requested
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.lineItems && (
            <p className="text-sm text-destructive">{errors.lineItems}</p>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="w-[120px]">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="border-0 shadow-none focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="border-0 shadow-none focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateLineItem(item.id, 'unit', v)}
                      >
                        <SelectTrigger className="border-0 shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.slice(0, 15).map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="border-0 shadow-none focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {currency} {item.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button type="button" variant="outline" onClick={addLineItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-24">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((cur) => (
                    <SelectItem key={cur.value} value={cur.value}>
                      {cur.symbol} {cur.value} - {cur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryTerms">Delivery Terms</Label>
              <Input
                id="deliveryTerms"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="e.g., FOB, CIF, DDP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Validity (Days)</Label>
              <Input
                id="validity"
                type="number"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                min="1"
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about your proposal..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            isEditMode ? 'Update Proposal' : 'Create Proposal'
          )}
        </Button>
      </div>
    </form>
  )
}
