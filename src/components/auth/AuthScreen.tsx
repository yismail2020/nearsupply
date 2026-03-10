'use client'

/**
 * Auth Screen Component
 *
 * Displays login or register form based on mode.
 * Handles form submission and authentication.
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Building2 } from 'lucide-react'

interface AuthScreenProps {
  mode: 'login' | 'register'
  onToggleMode: () => void
}

export function AuthScreen({ mode, onToggleMode }: AuthScreenProps) {
  const { login, register } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState<'CLIENT' | 'SUPPLIER'>('CLIENT')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === 'login') {
        const result = await login({ email, password })
        if (!result.success) {
          setError(result.error || 'Login failed')
        }
      } else {
        const result = await register({
          email,
          password,
          name: name || undefined,
          company: company || undefined,
          role,
        })
        if (!result.success) {
          setError(result.error || 'Registration failed')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">NearSupply</h1>
          <p className="text-muted-foreground">
            RFQ & Quotation Management Platform
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Sign in to your account to continue'
                : 'Register to start managing your RFQs'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Company (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Your Company Name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Role (Register only) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select value={role} onValueChange={(v: 'CLIENT' | 'SUPPLIER') => setRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client - Looking for suppliers</SelectItem>
                      <SelectItem value="SUPPLIER">Supplier - Providing products/services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Demo Credentials Info */}
              {mode === 'login' && (
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Demo Accounts:</p>
                  <p>Admin: admin@nearsupply.com / admin123</p>
                  <p>Supplier: supplier@example.com / supplier123</p>
                  <p>Client: client@example.com / client123</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </Button>

              {/* Toggle Mode */}
              <p className="text-sm text-muted-foreground text-center">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={onToggleMode}
                    >
                      Register
                    </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={onToggleMode}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © 2024 NearSupply. All rights reserved.
        </p>
      </div>
    </div>
  )
}
