/**
 * Prisma Client Singleton
 *
 * Safe singleton pattern for Prisma Client in Next.js
 * Prevents multiple instances during development hot reloads
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  db: PrismaClient | undefined
}

/**
 * Database client instance
 * Uses singleton pattern to prevent multiple connections in development
 */
export const db =
  globalForPrisma.db ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  })

// Store in global to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.db = db
}

/**
 * Graceful shutdown handler
 * Call this when the application is shutting down
 */
export async function disconnectDB(): Promise<void> {
  await db.$disconnect()
}

/**
 * Health check for database connection
 */
export async function checkDBConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// Export types for convenience
export type { User, UserRole, RFQRequest, RFQStatus, RFQRequestType } from '@prisma/client'
export type { RFQItem, Proposal, ProposalStatus, Product, ProductStatus } from '@prisma/client'
export type { Notification, SiteSettings, UploadedFile } from '@prisma/client'
