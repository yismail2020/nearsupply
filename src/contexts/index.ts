/**
 * Contexts Index
 *
 * Re-exports all context providers and hooks
 */

export {
  AuthProvider,
  useAuth,
  useHasRole,
  useIsAdmin,
  useIsSupplier,
  useIsClient,
  type User,
  type AuthContextValue,
  type LoginCredentials,
  type RegisterData,
} from './AuthContext'
