'use client'

/**
 * Home Page
 *
 * Main entry point that displays either:
 * - Auth page for unauthenticated users
 * - Dashboard for authenticated users
 * 
 * Supports view switching for different sections:
 * - dashboard
 * - rfq
 * - proposals
 * - products
 * - users
 * - settings
 * - profile
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthPage } from '@/components/auth/AuthPage'
import { DashboardLayout } from '@/components/shared/DashboardLayout'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { RFQList } from '@/components/rfq/RFQList'
import { CreateRFQForm } from '@/components/rfq/CreateRFQForm'
import { ProposalsList } from '@/components/proposals/ProposalsList'
import { ProductsList } from '@/components/products/ProductsList'
import { UsersManagement } from '@/components/users/UsersManagement'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { SettingsPage } from '@/components/settings/SettingsPage'

// View types
export type ViewType = 
  | 'dashboard' 
  | 'rfq' 
  | 'rfq-new' 
  | 'proposals' 
  | 'products' 
  | 'users' 
  | 'settings' 
  | 'profile'

// Context for view navigation
import { createContext, useContext, type ReactNode } from 'react'

interface NavigationContextValue {
  currentView: ViewType
  navigateTo: (view: ViewType) => void
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Get initial view from URL hash
function getInitialView(): ViewType {
  if (typeof window === 'undefined') return 'dashboard'
  const hash = window.location.hash.slice(1) as ViewType
  const validViews: ViewType[] = [
    'dashboard', 'rfq', 'rfq-new', 'proposals', 'products', 'users', 'settings', 'profile'
  ]
  return validViews.includes(hash) ? hash : 'dashboard'
}

function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>(getInitialView)

  // Update URL hash when view changes
  const navigateTo = (view: ViewType) => {
    setCurrentView(view)
    window.location.hash = view
  }

  return (
    <NavigationContext.Provider value={{ currentView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  )
}

// View renderer component
function ViewRenderer() {
  const { currentView } = useNavigation()
  const { user } = useAuth()

  // Check if user has access to the current view
  const canAccessView = (view: ViewType): boolean => {
    const role = user?.role
    switch (view) {
      case 'users':
      case 'settings':
        return role === 'ADMIN'
      case 'products':
        return role === 'ADMIN' || role === 'SUPPLIER'
      default:
        return true
    }
  }

  // Redirect if no access
  if (!canAccessView(currentView)) {
    return <DashboardView />
  }

  // Render the appropriate view
  switch (currentView) {
    case 'rfq':
      return <RFQList />
    case 'rfq-new':
      return (
        <div className="space-y-6">
          <CreateRFQForm 
            onSuccess={() => window.location.hash = 'rfq'} 
            onCancel={() => window.location.hash = 'rfq'} 
          />
        </div>
      )
    case 'proposals':
      return <ProposalsList />
    case 'products':
      return <ProductsList />
    case 'users':
      return <UsersManagement />
    case 'profile':
      return <ProfileForm />
    case 'settings':
      return <SettingsPage />
    case 'dashboard':
    default:
      return <DashboardView />
  }
}

export default function Home() {
  const { user, loading, initialized } = useAuth()

  // Show loading screen while initializing
  if (!initialized || (loading && !user)) {
    return <LoadingScreen />
  }

  // Show auth page for unauthenticated users
  if (!user) {
    return <AuthPage />
  }

  // Show dashboard for authenticated users
  return (
    <NavigationProvider>
      <DashboardLayout>
        <ViewRenderer />
      </DashboardLayout>
    </NavigationProvider>
  )
}
