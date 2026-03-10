/**
 * File Upload API Route
 *
 * POST /api/upload - Upload a file
 * DELETE /api/upload - Delete a file by URL
 * GET /api/upload - List uploaded files
 *
 * Supported file types: pdf, doc, docx, xls, xlsx, ppt, pptx, csv, txt, jpg, jpeg, png, webp, zip, rar, 7z
 * Max file size: 10 MB
 * Save path: public/uploads/YYYY-MM-DD/
 */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response'
import { db } from '@/lib/db'
import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ==================== Configuration ====================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Allowed file extensions and their MIME types
const ALLOWED_FILES: Record<string, string[]> = {
  // Documents
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  // Data
  csv: ['text/csv', 'application/csv'],
  txt: ['text/plain'],
  // Images
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  // Archives
  zip: ['application/zip', 'application/x-zip-compressed'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar'],
  '7z': ['application/x-7z-compressed'],
}

// Flatten allowed extensions
const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_FILES)

// ==================== Helper Functions ====================

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Validate file extension
 */
function isValidExtension(ext: string): boolean {
  return ALLOWED_EXTENSIONS.includes(ext)
}

/**
 * Validate MIME type for extension
 */
function isValidMimeType(ext: string, mimeType: string): boolean {
  const allowedMimes = ALLOWED_FILES[ext]
  if (!allowedMimes) return false

  // Allow generic octet-stream for archives and documents
  if (mimeType === 'application/octet-stream') {
    return ['zip', 'rar', '7z', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)
  }

  return allowedMimes.some((allowed) =>
    mimeType.toLowerCase().includes(allowed.toLowerCase())
  )
}

/**
 * Generate a safe filename
 */
function generateSafeFileName(originalName: string): string {
  const ext = getFileExtension(originalName)
  const timestamp = Date.now()
  const random = randomUUID().slice(0, 8)
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 100)

  return `${timestamp}-${random}-${sanitizedName}`
}

/**
 * Get date-based upload directory
 */
function getDateBasedDir(): { dirPath: string; dateDir: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateDir = `${year}-${month}-${day}`
  const dirPath = path.join(UPLOAD_DIR, dateDir)

  return { dirPath, dateDir }
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

/**
 * Safely parse file URL to get file path
 */
function parseFileUrl(url: string): { filePath: string; publicPath: string } | null {
  try {
    // URL format: /uploads/YYYY-MM-DD/filename
    if (!url.startsWith('/uploads/')) {
      return null
    }

    const publicPath = url
    const filePath = path.join(process.cwd(), 'public', url)

    // Ensure the path is within uploads directory (prevent path traversal)
    const normalizedPath = path.normalize(filePath)
    if (!normalizedPath.startsWith(UPLOAD_DIR)) {
      return null
    }

    return { filePath, publicPath }
  } catch {
    return null
  }
}

// ==================== POST - Upload File ====================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const entity = (formData.get('entity') as string | null) || undefined
    const entityId = (formData.get('entityId') as string | null) || undefined

    if (!file) {
      return errorResponse('No file provided')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`)
    }

    // Validate file extension
    const ext = getFileExtension(file.name)
    if (!isValidExtension(ext)) {
      return errorResponse(
        `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    }

    // Validate MIME type
    if (!isValidMimeType(ext, file.type)) {
      return errorResponse(`Invalid file type. Expected ${ext} file but got ${file.type}`)
    }

    // Create upload directory
    const { dirPath, dateDir } = getDateBasedDir()
    await ensureDir(dirPath)

    // Generate safe filename
    const safeFileName = generateSafeFileName(file.name)
    const filePath = path.join(dirPath, safeFileName)
    const publicUrl = `/uploads/${dateDir}/${safeFileName}`

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save to database
    const uploadedFile = await db.uploadedFile.create({
      data: {
        userId: user.id,
        originalName: file.name,
        fileName: safeFileName,
        filePath: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        entity: entity,
        entityId: entityId,
      },
    })

    // Return attachment metadata
    return successResponse(
      {
        id: uploadedFile.id,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: uploadedFile.createdAt.toISOString(),
        uploadedBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      'File uploaded successfully',
      201
    )
  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Failed to upload file', 500)
  }
}

// ==================== DELETE - Delete File ====================

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Get URL from request body
    const body = await request.json()
    const { url } = body

    if (!url) {
      return errorResponse('File URL is required')
    }

    // Parse URL to get file path
    const parsedUrl = parseFileUrl(url)
    if (!parsedUrl) {
      return errorResponse('Invalid file URL')
    }

    const { filePath, publicPath } = parsedUrl

    // Check if file exists in database
    const uploadedFile = await db.uploadedFile.findFirst({
      where: {
        filePath: publicPath,
        userId: user.id,
      },
    })

    // Delete from database (only if user owns it)
    if (uploadedFile) {
      await db.uploadedFile.delete({
        where: { id: uploadedFile.id },
      })
    } else {
      return errorResponse('File not found or access denied', 404)
    }

    // Check if file exists on disk
    if (existsSync(filePath)) {
      // Verify it's a file, not a directory
      const stats = await stat(filePath)
      if (stats.isFile()) {
        await unlink(filePath)
      }
    }

    return successResponse(null, 'File deleted successfully')
  } catch (error) {
    console.error('Delete error:', error)
    return errorResponse('Failed to delete file', 500)
  }
}

// ==================== GET - List Files ====================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: Record<string, unknown> = {
      userId: user.id,
    }

    if (entity) {
      where.entity = entity
    }
    if (entityId) {
      where.entityId = entityId
    }

    // Get files
    const files = await db.uploadedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get total count
    const total = await db.uploadedFile.count({ where })

    // Format response
    const formattedFiles = files.map((file) => ({
      id: file.id,
      name: file.originalName,
      url: file.filePath,
      size: file.fileSize,
      type: file.mimeType,
      entity: file.entity,
      entityId: file.entityId,
      uploadedAt: file.createdAt.toISOString(),
    }))

    return successResponse({
      files: formattedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('List files error:', error)
    return errorResponse('Failed to list files', 500)
  }
}
