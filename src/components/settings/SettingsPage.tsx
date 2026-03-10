'use client'

/**
 * Settings Page Component
 *
 * Platform settings for administrators including:
 * - General platform settings
 * - Notification preferences
 * - Email configuration
 * - Security settings
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings,
  Building2,
  Bell,
  Mail,
  Shield,
  Globe,
  Database,
  Save,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

// ==================== Settings Types ====================

interface PlatformSettings {
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  website: string
  timezone: string
  currency: string
  dateFormat: string
}

interface NotificationSettings {
  emailNotifications: boolean
  rfqCreated: boolean
  proposalSubmitted: boolean
  proposalAccepted: boolean
  proposalRejected: boolean
  dailyDigest: boolean
  weeklyReport: boolean
}

interface EmailSettings {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPassword: string
  senderName: string
  senderEmail: string
}

interface SecuritySettings {
  twoFactorAuth: boolean
  sessionTimeout: string
  passwordExpiry: string
  loginAttempts: string
}

// ==================== Default Settings ====================

const defaultPlatformSettings: PlatformSettings = {
  companyName: 'NearSupply',
  companyEmail: 'contact@nearsupply.com',
  companyPhone: '+1 (555) 123-4567',
  companyAddress: '123 Business Ave, Suite 100, New York, NY 10001',
  website: 'https://nearsupply.com',
  timezone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
}

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  rfqCreated: true,
  proposalSubmitted: true,
  proposalAccepted: true,
  proposalRejected: true,
  dailyDigest: false,
  weeklyReport: true,
}

const defaultEmailSettings: EmailSettings = {
  smtpHost: 'smtp.example.com',
  smtpPort: '587',
  smtpUser: 'noreply@nearsupply.com',
  smtpPassword: '',
  senderName: 'NearSupply Platform',
  senderEmail: 'noreply@nearsupply.com',
}

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: '30',
  passwordExpiry: '90',
  loginAttempts: '5',
}

// ==================== Component ====================

export function SettingsPage() {
  const { user } = useAuth()
  
  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings)
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(defaultEmailSettings)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings)
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Handle save settings
  const handleSave = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Settings saved successfully')
    setHasChanges(false)
    setIsLoading(false)
  }

  // Handle reset settings
  const handleReset = () => {
    setPlatformSettings(defaultPlatformSettings)
    setNotificationSettings(defaultNotificationSettings)
    setEmailSettings(defaultEmailSettings)
    setSecuritySettings(defaultSecuritySettings)
    setHasChanges(false)
    toast.info('Settings reset to defaults')
  }

  // Update platform setting
  const updatePlatformSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setPlatformSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Update notification setting
  const updateNotificationSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Update email setting
  const updateEmailSetting = <K extends keyof EmailSettings>(
    key: K,
    value: EmailSettings[K]
  ) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Update security setting
  const updateSecuritySetting = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K]
  ) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your platform configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details and branding information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={platformSettings.companyName}
                    onChange={(e) => updatePlatformSetting('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={platformSettings.companyEmail}
                    onChange={(e) => updatePlatformSetting('companyEmail', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input
                    id="companyPhone"
                    value={platformSettings.companyPhone}
                    onChange={(e) => updatePlatformSetting('companyPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={platformSettings.website}
                    onChange={(e) => updatePlatformSetting('website', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Input
                  id="companyAddress"
                  value={platformSettings.companyAddress}
                  onChange={(e) => updatePlatformSetting('companyAddress', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure timezone, currency, and date format preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={platformSettings.timezone}
                    onValueChange={(value) => updatePlatformSetting('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={platformSettings.currency}
                    onValueChange={(value) => updatePlatformSetting('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={platformSettings.dateFormat}
                    onValueChange={(value) => updatePlatformSetting('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    updateNotificationSetting('emailNotifications', checked)
                  }
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Event Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>RFQ Created</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a new RFQ is created
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.rfqCreated}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('rfqCreated', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Proposal Submitted</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a supplier submits a proposal
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.proposalSubmitted}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('proposalSubmitted', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Proposal Accepted</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a proposal is accepted
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.proposalAccepted}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('proposalAccepted', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Proposal Rejected</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a proposal is rejected
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.proposalRejected}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('proposalRejected', checked)
                      }
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Reports</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary of activities
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyDigest}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('dailyDigest', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly analytics report
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting('weeklyReport', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure email server settings for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.example.com"
                    value={emailSettings.smtpHost}
                    onChange={(e) => updateEmailSetting('smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    placeholder="587"
                    value={emailSettings.smtpPort}
                    onChange={(e) => updateEmailSetting('smtpPort', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    placeholder="username"
                    value={emailSettings.smtpUser}
                    onChange={(e) => updateEmailSetting('smtpUser', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => updateEmailSetting('smtpPassword', e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    placeholder="NearSupply Platform"
                    value={emailSettings.senderName}
                    onChange={(e) => updateEmailSetting('senderName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    placeholder="noreply@nearsupply.com"
                    value={emailSettings.senderEmail}
                    onChange={(e) => updateEmailSetting('senderEmail', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Send Test Email
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => 
                    updateSecuritySetting('twoFactorAuth', checked)
                  }
                />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select
                    value={securitySettings.sessionTimeout}
                    onValueChange={(value) => updateSecuritySetting('sessionTimeout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Select
                    value={securitySettings.passwordExpiry}
                    onValueChange={(value) => updateSecuritySetting('passwordExpiry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Select
                    value={securitySettings.loginAttempts}
                    onValueChange={(value) => updateSecuritySetting('loginAttempts', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                      <SelectItem value="0">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage platform data and backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Export all platform data to a CSV file
                  </p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Backup Database</p>
                  <p className="text-sm text-muted-foreground">
                    Create a backup of the current database
                  </p>
                </div>
                <Button variant="outline">Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
