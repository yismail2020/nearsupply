'use client'

/**
 * Create RFQ Form Component
 *
 * Form for creating and editing RFQs with line items management.
 * Supports CSV import/export for line items.
 */

import { useState, useEffect, useRef } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  GripVertical,
  FileDown,
  FileUp,
  Upload,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createRFQ, updateRFQ, getRFQ, exportLineItemsToCSV, parseCSVToLineItems, downloadCSV, getCSVTemplate } from '@/lib/api/rfq'
import { RFQ_CATEGORIES, CURRENCIES, UNITS } from '@/lib/utils/helpers'
import type { RFQ, RFQLineItemInput, RFQRequestType } from '@/types/rfq'

// ==================== Types ====================

interface CreateRFQFormProps {
  rfqId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface LineItem extends RFQLineItemInput {
  id: string // local id for react key
}

// ==================== Default Values ====================

const defaultLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'pcs',
  specifications: '',
  link: '',
  imageUrl: '',
  sortOrder: 0,
})

const defaultFormData = () => ({
  requestType: 'PRODUCT' as RFQRequestType,
  title: '',
  description: '',
  category: '',
  budget: '',
  currency: 'USD',
  deadlineDate: '',
  deliveryDate: '',
  deliveryTerms: '',
  deliveryAddress: '',
  notes: '',
  internalNotes: '',
  attachments: [] as string[],
  lineItems: [defaultLineItem()],
})

// ==================== Component ====================

export function CreateRFQForm({ rfqId, onSuccess, onCancel }: CreateRFQFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // State
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!!rfqId)
  const [formData, setFormData] = useState(defaultFormData())
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const isEditMode = !!rfqId
  const isAdmin = user?.role === 'ADMIN'

  // Load existing RFQ data
  useEffect(() => {
    if (rfqId) {
      loadRFQ(rfqId)
    }
  }, [rfqId])

  const loadRFQ = async (id: string) => {
    try {
      setInitialLoading(true)
      const response = await getRFQ(id)
      
      if (response.success && response.data) {
        const rfq = response.data
        setFormData({
          requestType: rfq.requestType,
          title: rfq.title,
          description: rfq.description || '',
          category: rfq.category || '',
          budget: rfq.budget?.toString() || '',
          currency: rfq.currency || 'USD',
          deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.split('T')[0] : '',
          deliveryDate: rfq.deliveryDate ? rfq.deliveryDate.split('T')[0] : '',
          deliveryTerms: rfq.deliveryTerms || '',
          deliveryAddress: rfq.deliveryAddress || '',
          notes: rfq.notes || '',
          internalNotes: rfq.internalNotes || '',
          attachments: [],
          lineItems: rfq.lineItems.map((item, index) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            specifications: item.specifications || '',
            link: item.link || '',
            imageUrl: item.imageUrl || '',
            sortOrder: item.sortOrder ?? index,
          })),
        })
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

  // Form handlers
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Line item handlers
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, defaultLineItem()],
    }))
  }

  const removeLineItem = (id: string) => {
    if (formData.lineItems.length <= 1) {
      toast({
        title: 'Cannot Remove',
        description: 'At least one line item is required',
        variant: 'destructive',
      })
      return
    }
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }))
  }

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const moveLineItem = (id: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const items = [...prev.lineItems]
      const index = items.findIndex(item => item.id === id)
      
      if (direction === 'up' && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]]
      } else if (direction === 'down' && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]]
      }
      
      // Update sort order
      return {
        ...prev,
        lineItems: items.map((item, i) => ({ ...item, sortOrder: i })),
      }
    })
  }

  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // CSV handlers
  const handleExportCSV = () => {
    const items = formData.lineItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      specifications: item.specifications,
      link: item.link,
      imageUrl: item.imageUrl,
    }))
    const csv = exportLineItemsToCSV(items)
    downloadCSV(csv, `rfq-line-items-${Date.now()}.csv`)
    toast({
      title: 'Exported',
      description: 'Line items exported to CSV',
    })
  }

  const handleDownloadTemplate = () => {
    const template = getCSVTemplate()
    downloadCSV(template, 'rfq-line-items-template.csv')
    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded',
    })
  }

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const items = parseCSVToLineItems(content)
        
        if (items.length === 0) {
          toast({
            title: 'Import Failed',
            description: 'No valid line items found in CSV',
            variant: 'destructive',
          })
          return
        }

        setFormData(prev => ({
          ...prev,
          lineItems: items.map(item => ({
            ...item,
            id: crypto.randomUUID(),
          })),
        }))

        toast({
          title: 'Imported',
          description: `${items.length} line items imported from CSV`,
        })
      } catch {
        toast({
          title: 'Import Failed',
          description: 'Failed to parse CSV file',
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = ''
    }
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string[]> = {}

    if (!formData.title.trim()) {
      newErrors.title = ['Title is required']
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = ['Budget must be a valid number']
    }

    // Validate line items
    const lineItemErrors: string[] = []
    formData.lineItems.forEach((item, index) => {
      if (!item.name.trim()) {
        lineItemErrors.push(`Item ${index + 1}: Name is required`)
      }
      if (item.quantity <= 0) {
        lineItemErrors.push(`Item ${index + 1}: Quantity must be positive`)
      }
      if (item.link && !isValidUrl(item.link)) {
        lineItemErrors.push(`Item ${index + 1}: Invalid link URL`)
      }
      if (item.imageUrl && !isValidUrl(item.imageUrl)) {
        lineItemErrors.push(`Item ${index + 1}: Invalid image URL`)
      }
    })

    if (lineItemErrors.length > 0) {
      newErrors.lineItems = lineItemErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
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
      if (isEditMode && rfqId) {
        await updateRFQ(rfqId, formData)
        toast({
          title: 'Success',
          description: 'RFQ updated successfully',
        })
      } else {
        await createRFQ(formData)
        toast({
          title: 'Success',
          description: 'RFQ created successfully',
        })
      }

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save RFQ',
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
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the main details of your RFQ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Request Type */}
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select
                value={formData.requestType}
                onValueChange={(v) => updateField('requestType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => updateField('category', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RFQ_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter RFQ title"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your requirements..."
              rows={3}
            />
          </div>

          {/* Budget & Currency */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => updateField('currency', v)}
              >
                <SelectTrigger>
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

      {/* Dates & Delivery */}
      <Card>
        <CardHeader>
          <CardTitle>Dates & Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deadlineDate">Submission Deadline</Label>
              <Input
                id="deadlineDate"
                type="date"
                value={formData.deadlineDate}
                onChange={(e) => updateField('deadlineDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Expected Delivery</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => updateField('deliveryDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryTerms">Delivery Terms</Label>
            <Input
              id="deliveryTerms"
              value={formData.deliveryTerms}
              onChange={(e) => updateField('deliveryTerms', e.target.value)}
              placeholder="e.g., FOB, CIF, DDP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Delivery Address</Label>
            <Textarea
              id="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={(e) => updateField('deliveryAddress', e.target.value)}
              placeholder="Full delivery address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Add items you want to request quotes for
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => csvInputRef.current?.click()}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Template
              </Button>
              {formData.lineItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.lineItems && (
            <div className="rounded-md bg-destructive/10 p-3">
              {errors.lineItems.map((error, i) => (
                <p key={i} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          )}

          {/* Line Items Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Item Name *</TableHead>
                  <TableHead className="w-[100px]">Qty *</TableHead>
                  <TableHead className="w-[120px]">Unit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveLineItem(item.id, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveLineItem(item.id, 'down')}
                            disabled={index === formData.lineItems.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
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
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleItemExpanded(item.id)}
                          >
                            {expandedItems.has(item.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Row */}
                    {expandedItems.has(item.id) && (
                      <TableRow key={`${item.id}-expanded`}>
                        <TableCell colSpan={6} className="bg-muted/50">
                          <div className="grid gap-4 p-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Specifications</Label>
                              <Textarea
                                value={item.specifications || ''}
                                onChange={(e) => updateLineItem(item.id, 'specifications', e.target.value)}
                                placeholder="Detailed specifications..."
                                rows={2}
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3" />
                                  Link
                                </Label>
                                <Input
                                  value={item.link || ''}
                                  onChange={(e) => updateLineItem(item.id, 'link', e.target.value)}
                                  placeholder="https://..."
                                  type="url"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Image URL
                                </Label>
                                <Input
                                  value={item.imageUrl || ''}
                                  onChange={(e) => updateLineItem(item.id, 'imageUrl', e.target.value)}
                                  placeholder="https://..."
                                  type="url"
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Suppliers</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional information for suppliers..."
              rows={3}
            />
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal Notes (Admin Only)</Label>
              <Textarea
                id="internalNotes"
                value={formData.internalNotes}
                onChange={(e) => updateField('internalNotes', e.target.value)}
                placeholder="Notes visible only to admins..."
                rows={2}
              />
            </div>
          )}
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
            isEditMode ? 'Update RFQ' : 'Create RFQ'
          )}
        </Button>
      </div>
    </form>
  )
}
