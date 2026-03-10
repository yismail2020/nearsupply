'use client'

/**
 * Edit User Form Component
 *
 * Form for editing existing users (Admin only).
 */

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, X } from 'lucide-react'
import { updateUser } from '@/lib/api/user'
import { USER_ROLE_LABELS } from '@/lib/utils/helpers'
import type { User, UserRole, UserEditFormData } from '@/types/user'

// ==================== Types ====================

interface EditUserFormProps {
  user: User
  onSuccess: () => void
  onCancel: () => void
}

// ==================== Main Component ====================

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UserEditFormData>({
    name: '',
    email: '',
    role: 'CLIENT',
    company: '',
    phone: '',
    avatar: '',
    address: '',
    isActive: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof UserEditFormData, string>>>({})

  // Initialize form with user data
  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      address: user.address || '',
      isActive: user.isActive,
    })
    setErrors({})
  }, [user])

  // Handle input change
  const handleChange = (
    field: keyof UserEditFormData,
    value: string | boolean | UserRole
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserEditFormData, string>> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.avatar && !/^https?:\/\/.+/.test(formData.avatar)) {
      newErrors.avatar = 'Avatar must be a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      await updateUser(user.id, formData)
      toast({
        title: 'Success',
        description: 'User updated successfully',
      })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="user@example.com"
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Full name"
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(v) => handleChange('role', v as UserRole)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="Company name"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Phone number"
        />
      </div>

      {/* Avatar URL */}
      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input
          id="avatar"
          value={formData.avatar}
          onChange={(e) => handleChange('avatar', e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className={errors.avatar ? 'border-destructive' : ''}
        />
        {errors.avatar && (
          <p className="text-sm text-destructive">{errors.avatar}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Full address"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">Active (can login)</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Update User
        </Button>
      </div>
    </form>
  )
}
