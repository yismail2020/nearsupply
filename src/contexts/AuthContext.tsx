'use client'

/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Handles user session management, login, registration, and logout.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

// ==================== Types ====================

export interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'SUPPLIER' | 'CLIENT'
  company: string | null
  avatar: string | null
}

export interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
  company?: string
  role?: 'ADMIN' | 'SUPPLIER' | 'CLIENT'
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ==================== Provider ====================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  /**
   * Fetch current user from the server
   */
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.user) {
          setUser(data.data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    }
  }, [])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)
      await fetchUser()
      if (mounted) {
        setLoading(false)
        setInitialized(true)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [fetchUser])

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success && data.data?.user) {
        setUser(data.data.user)
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Register a new user
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success && responseData.data?.user) {
        setUser(responseData.data.user)
        return { success: true }
      }

      return { success: false, error: responseData.error || 'Registration failed' }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'An error occurred during registration' }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true)

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user on error
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    setLoading(true)
    await fetchUser()
    setLoading(false)
  }, [fetchUser])

  const value: AuthContextValue = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ==================== Hook ====================

/**
 * Hook to access authentication context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// ==================== Utility Hooks ====================

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: 'ADMIN' | 'SUPPLIER' | 'CLIENT' | ('ADMIN' | 'SUPPLIER' | 'CLIENT')[]): boolean {
  const { user } = useAuth()

  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasRole('ADMIN')
}

/**
 * Hook to check if user is supplier
 */
export function useIsSupplier(): boolean {
  return useHasRole('SUPPLIER')
}

/**
 * Hook to check if user is client
 */
export function useIsClient(): boolean {
  return useHasRole('CLIENT')
}
