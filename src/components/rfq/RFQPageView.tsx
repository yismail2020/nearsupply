'use client'

/**
 * RFQ Page View Component
 *
 * Main page component for RFQ management.
 * Integrates list, create, and detail views.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { RFQList } from '@/components/rfq/RFQList'
import { CreateRFQForm } from '@/components/rfq/CreateRFQForm'
import { DashboardLayout } from '@/components/shared/DashboardLayout'

export function RFQPageView() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)

  const canCreate = user?.role === 'ADMIN' || user?.role === 'CLIENT'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RFQ Management</h1>
            <p className="text-muted-foreground">
              Create and manage Requests for Quotation
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New RFQ
            </Button>
          )}
        </div>

        {/* RFQ List */}
        <RFQList />

        {/* Create RFQ Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New RFQ</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new Request for Quotation
              </DialogDescription>
            </DialogHeader>
            <CreateRFQForm
              onSuccess={() => setCreateOpen(false)}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
