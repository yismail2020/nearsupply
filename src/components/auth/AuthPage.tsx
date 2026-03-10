'use client'

/**
 * Authentication Page Component
 *
 * Beautiful auth UI with tabs for login/register.
 * Connects to AuthContext for authentication operations.
 */

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Lock, User, Building2, Package, ShoppingCart } from 'lucide-react'

// ==================== Types ====================

type AuthMode = 'login' | 'register'

// ==================== Component ====================

export function AuthPage() {
  const { login, register, loading } = useAuth()
  const { toast } = useToast()

  // Tab state
  const [activeTab, setActiveTab] = useState<AuthMode>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerCompany, setRegisterCompany] = useState('')
  const [registerRole, setRegisterRole] = useState<'CLIENT' | 'SUPPLIER'>('CLIENT')

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==================== Handlers ====================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginEmail || !loginPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email and password.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login({
        email: loginEmail,
        password: loginPassword,
      })

      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        })
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid email or password.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!registerEmail || !registerPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    if (registerPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    if (registerPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        email: registerEmail,
        password: registerPassword,
        name: registerName || undefined,
        company: registerCompany || undefined,
        role: registerRole,
      })

      if (result.success) {
        toast({
          title: 'Account Created!',
          description: 'Welcome to NearSupply. You are now logged in.',
        })
      } else {
        toast({
          title: 'Registration Failed',
          description: result.error || 'Could not create your account.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = loading || isSubmitting

  // ==================== Render ====================

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

      <div className="relative z-10 w-full max-w-lg space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">NearSupply</h1>
          <p className="text-muted-foreground text-sm">
            RFQ & Quotation Management Platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AuthMode)}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              <CardDescription className="pt-4 text-center">
                {activeTab === 'login'
                  ? 'Enter your credentials to access your account'
                  : 'Fill in the form below to create your account'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Login Form */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Demo Accounts
                  </p>
                  <div className="grid gap-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Admin:</span>
                      <span>admin@nearsupply.com / admin123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Supplier:</span>
                      <span>supplier@example.com / supplier123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Client:</span>
                      <span>client@example.com / client123</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          disabled={isLoading}
                          className="pl-10"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className="pl-10"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-company">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-company"
                        type="text"
                        placeholder="Your Company"
                        value={registerCompany}
                        onChange={(e) => setRegisterCompany(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        autoComplete="organization"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="register-role">
                      I am a <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={registerRole}
                      onValueChange={(v) => setRegisterRole(v as 'CLIENT' | 'SUPPLIER')}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="register-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENT">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            <span>Client - Looking for suppliers</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="SUPPLIER">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Supplier - Providing products/services</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Note: Admin accounts are created via seed data only.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p>© 2024 NearSupply. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
