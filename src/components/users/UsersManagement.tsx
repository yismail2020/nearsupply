'use client'

/**
 * Users Management Component
 *
 * Admin-only component for managing users (CRUD operations).
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Building2,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react'
import { getUsers, deleteUser, updateUserStatus } from '@/lib/api/user'
import { formatDate, formatDateTime, USER_ROLE_LABELS } from '@/lib/utils/helpers'
import type { User, UserRole, UserQueryParams } from '@/types/user'
import { AddUserForm } from './AddUserForm'
import { EditUserForm } from './EditUserForm'

// ==================== Types ====================

// ==================== Role Badge Component ====================

function RoleBadge({ role }: { role: UserRole }) {
  const variants: Record<UserRole, { className: string }> = {
    ADMIN: { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    SUPPLIER: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    CLIENT: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  }

  const variant = variants[role] || variants.CLIENT

  return (
    <Badge variant="outline" className={`${variant.className} border-0`}>
      <Shield className="mr-1 h-3 w-3" />
      {USER_ROLE_LABELS[role] || role}
    </Badge>
  )
}

// ==================== Status Badge Component ====================

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
      <UserCheck className="mr-1 h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0">
      <UserX className="mr-1 h-3 w-3" />
      Inactive
    </Badge>
  )
}

// ==================== Main Component ====================

export function UsersManagement() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: UserQueryParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      if (search) params.search = search
      if (roleFilter !== 'all') params.role = roleFilter
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active'

      const response = await getUsers(params)

      if (response.success) {
        setUsers(response.data.data)
        setTotal(response.data.pagination.total)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, roleFilter, statusFilter, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setDetailOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedUser(null)
    setAddOpen(true)
  }

  const handleToggleStatus = async (user: User) => {
    setActionLoading(user.id)
    try {
      await updateUserStatus(user.id, !user.isActive)
      toast({
        title: 'Success',
        description: `User ${user.isActive ? 'deactivated' : 'activated'}`,
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: 'Error',
        description: 'Cannot delete your own account',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    setActionLoading(user.id)
    try {
      await deleteUser(user.id)
      toast({
        title: 'Success',
        description: 'User deleted',
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleFormSuccess = () => {
    setAddOpen(false)
    setEditOpen(false)
    setDetailOpen(false)
    setSelectedUser(null)
    fetchUsers()
  }

  // Get initials for avatar fallback
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  // Pagination
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as UserRole | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as 'active' | 'inactive' | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first user'}
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewUser(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {user.company ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {user.company}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={user.isActive} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          {user.id !== currentUser?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account
            </DialogDescription>
          </DialogHeader>
          <AddUserForm onSuccess={handleFormSuccess} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'No name'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <RoleBadge role={selectedUser.role} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge isActive={selectedUser.isActive} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p>{selectedUser.company || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{selectedUser.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{selectedUser.address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{formatDateTime(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p>{formatDateTime(selectedUser.updatedAt)}</p>
                </div>
              </div>

              {selectedUser._count && (
                <div className="grid grid-cols-3 gap-4 py-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedUser._count.rfqRequests}</p>
                    <p className="text-sm text-muted-foreground">RFQs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedUser._count.proposals}</p>
                    <p className="text-sm text-muted-foreground">Proposals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedUser._count.products}</p>
                    <p className="text-sm text-muted-foreground">Products</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setDetailOpen(false)
                    handleEditUser(selectedUser)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
