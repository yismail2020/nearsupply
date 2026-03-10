'use client'

/**
 * Dashboard Layout Component
 *
 * Main layout wrapper with sidebar navigation and header.
 * Navigation items are filtered based on user role.
 * Uses hash-based navigation for single-page view switching.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  ChevronDown,
  Building2,
  ShoppingCart,
  Truck,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigation, type ViewType } from '@/app/page'

// ==================== Types ====================

interface NavItem {
  label: string
  view: ViewType
  icon: LucideIcon
  roles: Array<'ADMIN' | 'SUPPLIER' | 'CLIENT'>
  badge?: string
}

// ==================== Navigation Config ====================

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    view: 'dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SUPPLIER', 'CLIENT'],
  },
  {
    label: 'RFQs',
    view: 'rfq',
    icon: FileText,
    roles: ['ADMIN', 'SUPPLIER', 'CLIENT'],
  },
  {
    label: 'New RFQ',
    view: 'rfq-new',
    icon: Plus,
    roles: ['ADMIN', 'CLIENT'],
  },
  {
    label: 'Proposals',
    view: 'proposals',
    icon: Package,
    roles: ['ADMIN', 'SUPPLIER', 'CLIENT'],
  },
  {
    label: 'Products',
    view: 'products',
    icon: ShoppingCart,
    roles: ['ADMIN', 'SUPPLIER'],
  },
  {
    label: 'Users',
    view: 'users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Settings',
    view: 'settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
]

// ==================== Sidebar Component ====================

interface SidebarProps {
  className?: string
  onItemClick?: () => void
}

function Sidebar({ className, onItemClick }: SidebarProps) {
  const { user } = useAuth()
  const { currentView, navigateTo } = useNavigation()

  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const handleNavClick = (view: ViewType) => {
    navigateTo(view)
    onItemClick?.()
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold">NearSupply</span>
          <span className="text-xs text-muted-foreground">RFQ Platform</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredNavItems.map((item) => (
          <Button
            key={item.view}
            variant={currentView === item.view ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-3',
              currentView === item.view && 'bg-secondary'
            )}
            onClick={() => handleNavClick(item.view)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>

      <Separator />

      {/* User Info (Bottom) */}
      {user && (
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
              <AvatarFallback>
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.company || user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Header Component ====================

interface HeaderProps {
  onMenuClick: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { navigateTo } = useNavigation()

  const handleLogout = async () => {
    await logout()
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'SUPPLIER':
        return 'default'
      case 'CLIENT':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
                <AvatarFallback className="text-xs">
                  {user?.name?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.name || user?.email}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {user?.company || 'No Company'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant={getRoleBadgeVariant(user?.role || '')} className="w-fit mt-1">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigateTo('profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateTo('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// ==================== Main Layout Component ====================

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background md:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="md:pl-64">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
