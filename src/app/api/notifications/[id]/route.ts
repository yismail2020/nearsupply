import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/utils/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/utils/response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    // Check ownership
    if (notification.userId !== user.id) {
      return errorResponse('Access denied', 403)
    }

    const updatedNotification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return successResponse(updatedNotification, 'Notification marked as read')
  } catch (error) {
    console.error('Mark notification read error:', error)
    return errorResponse('Failed to mark notification as read', 500)
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    // Check ownership
    if (notification.userId !== user.id) {
      return errorResponse('Access denied', 403)
    }

    await db.notification.delete({
      where: { id },
    })

    return successResponse(null, 'Notification deleted')
  } catch (error) {
    console.error('Delete notification error:', error)
    return errorResponse('Failed to delete notification', 500)
  }
}
