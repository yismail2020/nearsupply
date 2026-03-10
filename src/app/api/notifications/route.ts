import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response'

// GET - List User Notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      userId: user.id,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Get total count
    const total = await db.notification.count({ where })

    // Get notifications
    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    })

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
}

// PUT - Mark all as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return successResponse(null, 'All notifications marked as read')
  } catch (error) {
    console.error('Mark all read error:', error)
    return errorResponse('Failed to mark notifications as read', 500)
  }
}
