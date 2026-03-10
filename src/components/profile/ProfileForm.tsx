'use client'

/**
 * Profile Form Component
 *
 * Form for current user to update their profile and change password.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Save,
  User,
  Lock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Camera,
  Upload,
} from 'lucide-react'
import { getProfile, updateProfile, changePassword } from '@/lib/api/user'
import type { ProfileFormData, PasswordChangeFormData, User as UserType } from '@/types/user'

// ==================== Types ====================

interface ProfileFormProps {
  onUpdate?: () => void
}

// ==================== Initial Form Data ====================

const initialProfileData: ProfileFormData = {
  name: '',
  company: '',
  phone: '',
  avatar: '',
  address: '',
}

const initialPasswordData: PasswordChangeFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

// ==================== Main Component ====================

export function ProfileForm({ onUpdate }: ProfileFormProps) {
  const { user: authUser, refreshUser } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [profileData, setProfileData] = useState<ProfileFormData>(initialProfileData)
  const [passwordData, setPasswordData] = useState<PasswordChangeFormData>(initialPasswordData)

  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordChangeFormData, string>>>({})

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile()
        if (response.success) {
          setProfile(response.data)
          setProfileData({
            name: response.data.name || '',
            company: response.data.company || '',
            phone: response.data.phone || '',
            avatar: response.data.avatar || '',
            address: response.data.address || '',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  // Handle profile input change
  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle password input change
  const handlePasswordChange = (field: keyof PasswordChangeFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {}

    if (profileData.avatar && !/^https?:\/\/.+/.test(profileData.avatar)) {
      newErrors.avatar = 'Avatar must be a valid URL'
    }

    setProfileErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<Record<keyof PasswordChangeFormData, string>> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle profile submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateProfileForm()) return

    setProfileLoading(true)
    try {
      await updateProfile(profileData)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
      await refreshUser()
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswordForm()) return

    setPasswordLoading(true)
    try {
      await changePassword(passwordData)
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      })
      setPasswordData(initialPasswordData)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Get initials for avatar
  const getInitials = () => {
    if (profileData.name) {
      return profileData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return authUser?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileData.avatar || undefined} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profileData.name || 'User'}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {authUser?.email}
              </div>
              {profileData.company && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Building2 className="h-4 w-4" />
                  {profileData.company}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline mr-2 h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">
                    <Building2 className="inline mr-2 h-4 w-4" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline mr-2 h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                {/* Avatar URL */}
                <div className="space-y-2">
                  <Label htmlFor="avatar">
                    <Camera className="inline mr-2 h-4 w-4" />
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar"
                    value={profileData.avatar}
                    onChange={(e) => handleProfileChange('avatar', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={profileErrors.avatar ? 'border-destructive' : ''}
                  />
                  {profileErrors.avatar && (
                    <p className="text-sm text-destructive">{profileErrors.avatar}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <MapPin className="inline mr-2 h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    placeholder="Full address"
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={passwordErrors.newPassword ? 'border-destructive' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Stats */}
      {profile?._count && (
        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile._count.rfqRequests}</p>
                <p className="text-sm text-muted-foreground">RFQ Requests</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile._count.proposals}</p>
                <p className="text-sm text-muted-foreground">Proposals</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile._count.products}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile._count.uploadedFiles}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
