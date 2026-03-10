'use client'

/**
 * Dashboard Component
 *
 * Main dashboard view for authenticated users.
 * Shows role-specific content and navigation.
 */

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Users,
  Package,
  Building2,
  LogOut,
  Settings,
  Bell,
  Plus,
  ArrowRight,
} from 'lucide-react'

export function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Role-based quick actions
  const getQuickActions = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Manage Users', icon: Users, href: '/users' },
          { label: 'View All RFQs', icon: FileText, href: '/rfq' },
          { label: 'Review Proposals', icon: Package, href: '/proposals' },
          { label: 'Settings', icon: Settings, href: '/settings' },
        ]
      case 'SUPPLIER':
        return [
          { label: 'My Products', icon: Package, href: '/products' },
          { label: 'View RFQs', icon: FileText, href: '/rfq' },
          { label: 'My Proposals', icon: FileText, href: '/proposals' },
          { label: 'Profile', icon: Settings, href: '/profile' },
        ]
      case 'CLIENT':
        return [
          { label: 'New RFQ', icon: Plus, href: '/rfq/new' },
          { label: 'My RFQs', icon: FileText, href: '/rfq' },
          { label: 'View Proposals', icon: Package, href: '/proposals' },
          { label: 'Profile', icon: Settings, href: '/profile' },
        ]
      default:
        return []
    }
  }

  // Role-based stats
  const getStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Total Users', value: '-' },
          { label: 'Active RFQs', value: '-' },
          { label: 'Pending Reviews', value: '-' },
        ]
      case 'SUPPLIER':
        return [
          { label: 'My Products', value: '-' },
          { label: 'Active Proposals', value: '-' },
          { label: 'Open RFQs', value: '-' },
        ]
      case 'CLIENT':
        return [
          { label: 'My RFQs', value: '-' },
          { label: 'Quotes Received', value: '-' },
          { label: 'Pending', value: '-' },
        ]
      default:
        return []
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'SUPPLIER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'CLIENT':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">NearSupply</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Welcome back, {user?.name || user?.email}
              </h2>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your account today.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user?.role || '')}`}>
              {user?.role}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getStats().map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions based on your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <action.icon className="h-6 w-6" />
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user?.name || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {user?.company || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{user?.role}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="gap-2">
                  Edit Profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                This is the initial dashboard setup. Full functionality coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The backend APIs have been successfully implemented. Frontend pages for RFQ management,
                proposals, products, and user management will be built incrementally.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
