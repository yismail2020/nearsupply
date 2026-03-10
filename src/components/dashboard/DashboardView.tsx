'use client'

/**
 * Dashboard View Component
 *
 * Main dashboard content with summary cards and quick actions.
 * Content adapts based on user role.
 */

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Package,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Timer,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface StatCard {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  badge?: string
}

interface QuickAction {
  label: string
  description: string
  icon: LucideIcon
  href: string
  variant?: 'default' | 'outline' | 'secondary'
}

interface Activity {
  id: string
  type: 'rfq' | 'proposal' | 'user' | 'product'
  title: string
  description: string
  time: string
  status?: 'success' | 'pending' | 'warning'
}

// ==================== Stat Card Component ====================

function StatCard({ stat }: { stat: StatCard }) {
  const Icon = stat.icon

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            {stat.description && (
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {stat.trend && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {stat.trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={stat.trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {stat.trend.value}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
        {stat.badge && (
          <Badge variant="secondary" className="mt-3">
            {stat.badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Quick Action Card Component ====================

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon

  return (
    <Button
      variant={action.variant || 'outline'}
      className="h-auto flex-col items-start gap-2 p-4 text-left"
    >
      <div className="flex w-full items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{action.label}</p>
        <p className="text-xs text-muted-foreground">{action.description}</p>
      </div>
    </Button>
  )
}

// ==================== Activity Item Component ====================

function ActivityItem({ activity }: { activity: Activity }) {
  const getStatusIcon = () => {
    switch (activity.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getTypeIcon = () => {
    switch (activity.type) {
      case 'rfq':
        return <FileText className="h-4 w-4" />
      case 'proposal':
        return <Package className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'product':
        return <Package className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="rounded-lg bg-muted p-2">
        {getTypeIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
      </div>
    </div>
  )
}

// ==================== Role-Based Content ====================

function getAdminStats(): StatCard[] {
  return [
    {
      title: 'Total Users',
      value: '127',
      description: 'Active platform users',
      icon: Users,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active RFQs',
      value: '34',
      description: 'Open for proposals',
      icon: FileText,
      badge: '8 new today',
    },
    {
      title: 'Pending Reviews',
      value: '15',
      description: 'Proposals awaiting review',
      icon: Clock,
    },
    {
      title: 'Revenue',
      value: '$45,230',
      description: 'This month',
      icon: DollarSign,
      trend: { value: 8.2, isPositive: true },
    },
  ]
}

function getSupplierStats(): StatCard[] {
  return [
    {
      title: 'My Products',
      value: '24',
      description: 'Active listings',
      icon: Package,
    },
    {
      title: 'Open RFQs',
      value: '18',
      description: 'Available for bidding',
      icon: FileText,
      badge: '3 matching your category',
    },
    {
      title: 'My Proposals',
      value: '12',
      description: 'Total submitted',
      icon: FileText,
    },
    {
      title: 'Win Rate',
      value: '42%',
      description: 'Proposal acceptance rate',
      icon: TrendingUp,
      trend: { value: 5, isPositive: true },
    },
  ]
}

function getClientStats(): StatCard[] {
  return [
    {
      title: 'My RFQs',
      value: '8',
      description: 'Total requests',
      icon: FileText,
    },
    {
      title: 'Quotes Received',
      value: '23',
      description: 'From suppliers',
      icon: Package,
      badge: '5 pending review',
    },
    {
      title: 'In Progress',
      value: '3',
      description: 'Active RFQs',
      icon: Clock,
    },
    {
      title: 'Completed',
      value: '5',
      description: 'Fulfilled orders',
      icon: CheckCircle2,
    },
  ]
}

function getAdminQuickActions(): QuickAction[] {
  return [
    {
      label: 'Manage Users',
      description: 'Add or edit user accounts',
      icon: Users,
      href: '/users',
    },
    {
      label: 'Review RFQs',
      description: 'Process pending requests',
      icon: FileText,
      href: '/rfq',
    },
    {
      label: 'Review Proposals',
      description: 'Evaluate supplier quotes',
      icon: Package,
      href: '/proposals',
    },
    {
      label: 'Settings',
      description: 'Configure platform settings',
      icon: Building2,
      href: '/settings',
    },
  ]
}

function getSupplierQuickActions(): QuickAction[] {
  return [
    {
      label: 'Browse RFQs',
      description: 'Find new opportunities',
      icon: FileText,
      href: '/rfq',
    },
    {
      label: 'Add Product',
      description: 'Create new product listing',
      icon: Plus,
      href: '/products/new',
      variant: 'default',
    },
    {
      label: 'My Products',
      description: 'Manage your catalog',
      icon: Package,
      href: '/products',
    },
    {
      label: 'My Proposals',
      description: 'Track your submissions',
      icon: FileText,
      href: '/proposals',
    },
  ]
}

function getClientQuickActions(): QuickAction[] {
  return [
    {
      label: 'New RFQ',
      description: 'Create a new request',
      icon: Plus,
      href: '/rfq/new',
      variant: 'default',
    },
    {
      label: 'My RFQs',
      description: 'View your requests',
      icon: FileText,
      href: '/rfq',
    },
    {
      label: 'View Quotes',
      description: 'Review supplier proposals',
      icon: Package,
      href: '/proposals',
    },
    {
      label: 'Profile',
      description: 'Manage your account',
      icon: Users,
      href: '/profile',
    },
  ]
}

function getRecentActivities(): Activity[] {
  return [
    {
      id: '1',
      type: 'rfq',
      title: 'New RFQ Submitted',
      description: 'Office Supplies Q1 2025',
      time: '5 min ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'proposal',
      title: 'Proposal Received',
      description: 'From TechSupply Co.',
      time: '1 hour ago',
      status: 'pending',
    },
    {
      id: '3',
      type: 'user',
      title: 'New User Registered',
      description: 'supplier@company.com',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: '4',
      type: 'product',
      title: 'Product Updated',
      description: 'Ergonomic Office Chair',
      time: '3 hours ago',
    },
    {
      id: '5',
      type: 'rfq',
      title: 'RFQ Deadline Approaching',
      description: 'IT Equipment Request',
      time: '5 hours ago',
      status: 'warning',
    },
  ]
}

// ==================== Main Component ====================

export function DashboardView() {
  const { user } = useAuth()

  // Get role-based content
  const getStats = () => {
    switch (user?.role) {
      case 'ADMIN':
        return getAdminStats()
      case 'SUPPLIER':
        return getSupplierStats()
      case 'CLIENT':
        return getClientStats()
      default:
        return []
    }
  }

  const getQuickActions = () => {
    switch (user?.role) {
      case 'ADMIN':
        return getAdminQuickActions()
      case 'SUPPLIER':
        return getSupplierQuickActions()
      case 'CLIENT':
        return getClientQuickActions()
      default:
        return []
    }
  }

  const stats = getStats()
  const quickActions = getQuickActions()
  const activities = getRecentActivities()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your {user?.role === 'ADMIN' ? 'platform' : 'account'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action, index) => (
                <QuickActionCard key={index} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section (Role-specific) */}
      {user?.role === 'CLIENT' && (
        <Card>
          <CardHeader>
            <CardTitle>RFQ Pipeline</CardTitle>
            <CardDescription>
              Overview of your request status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Draft</span>
                  <span className="text-muted-foreground">2 RFQs</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Submitted</span>
                  <span className="text-muted-foreground">3 RFQs</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quotes Received</span>
                  <span className="text-muted-foreground">2 RFQs</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Completed</span>
                  <span className="text-muted-foreground">1 RFQ</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Performance */}
      {user?.role === 'SUPPLIER' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Proposal Performance</CardTitle>
              <CardDescription>
                Your submission success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">42%</p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">5/12</p>
                    <p className="text-sm text-muted-foreground">Accepted</p>
                  </div>
                </div>
                <Progress value={42} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Top performing product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Office Supplies</span>
                  <Badge variant="secondary">67%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">IT Equipment</span>
                  <Badge variant="secondary">45%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Furniture</span>
                  <Badge variant="secondary">38%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Overview */}
      {user?.role === 'ADMIN' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clients</span>
                  <span className="font-medium">89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Suppliers</span>
                  <span className="font-medium">35</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admins</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">RFQ Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open</span>
                  <span className="font-medium text-green-600">34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Under Review</span>
                  <span className="font-medium text-yellow-600">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium text-blue-600">156</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <Badge variant="outline" className="text-green-600">98%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Rate</span>
                  <Badge variant="outline" className="text-green-600">94%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Satisfaction</span>
                  <Badge variant="outline" className="text-green-600">4.8/5</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
