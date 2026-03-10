/**
 * Authentication Utilities
 *
 * Handles password hashing, session management, and user authentication
 * Compatible with Next.js App Router (Server Components and API Routes)
 */

import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { db, UserRole } from '../db'

// Session configuration
const SESSION_COOKIE_NAME = 'nearsupply_session'
const SESSION_DURATION_DAYS = 7
const BCRYPT_SALT_ROUNDS = 12
const TOKEN_SEPARATOR = '::'

// ==================== Types ====================

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  company: string | null
  avatar: string | null
}

export interface AuthResult {
  success: boolean
  user?: SessionUser
  error?: string
}

// ==================== Password Utilities ====================

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// ==================== Session Management ====================

/**
 * Generate a session token for a user
 * Format: userId::timestamp::random
 */
function generateSessionToken(userId: string): string {
  return `${userId}${TOKEN_SEPARATOR}${Date.now()}${TOKEN_SEPARATOR}${randomUUID().slice(0, 8)}`
}

/**
 * Parse user ID from session token
 */
function parseUserIdFromToken(token: string): string | null {
  const parts = token.split(TOKEN_SEPARATOR)
  if (parts.length !== 3) return null
  return parts[0]
}

/**
 * Get the current session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// ==================== User Authentication ====================

/**
 * Get the current authenticated user
 * For use in Server Components and API Routes
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken()
    if (!token) return null

    const userId = parseUserIdFromToken(token)
    if (!userId) return null

    // Validate userId format (cuid starts with 'c')
    if (!userId.startsWith('c') || userId.length < 20) {
      return null
    }

    // Find the user
    const user = await db.user.findFirst({
      where: {
        id: userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        avatar: true,
      },
    })

    return user
  } catch {
    return null
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Verify password
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Create session
    const token = generateSessionToken(user.id)
    await setSessionCookie(token)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        avatar: user.avatar,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  await clearSessionCookie()
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string
  password: string
  name?: string
  company?: string
  role?: UserRole
}): Promise<AuthResult> {
  try {
    const { email, password, name, company, role = 'CLIENT' } = data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        company,
        role,
      },
    })

    // Create session
    const token = generateSessionToken(user.id)
    await setSessionCookie(token)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        avatar: user.avatar,
      },
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'An error occurred during registration' }
  }
}

// ==================== Authorization ====================

/**
 * User role check type - allows both SessionUser and simpler types
 */
export type UserRoleCheck = { role: UserRole | string } | null

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: UserRoleCheck): boolean {
  return user?.role === 'ADMIN'
}

/**
 * Check if user is supplier
 */
export function isSupplier(user: UserRoleCheck): boolean {
  return user?.role === 'SUPPLIER'
}

/**
 * Check if user is client
 */
export function isClient(user: UserRoleCheck): boolean {
  return user?.role === 'CLIENT'
}

/**
 * Require authentication (throws if not authenticated)
 * For use in Server Components
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Require specific role (throws if not authorized)
 * For use in Server Components
 */
export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!hasRole(user.role, roles)) {
    throw new Error('FORBIDDEN')
  }
  return user
}
