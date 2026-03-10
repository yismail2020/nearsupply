import { z } from 'zod'

// ==================== AUTH VALIDATIONS ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  role: z.enum(['CLIENT', 'SUPPLIER']).default('CLIENT'),
})

export type RegisterInput = z.infer<typeof registerSchema>

// ==================== USER VALIDATIONS ====================

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
})

export type UserUpdateInput = z.infer<typeof userUpdateSchema>

// ==================== RFQ VALIDATIONS ====================

export const rfqLineItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
  specifications: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().default(0),
})

export type RFQLineItemInput = z.infer<typeof rfqLineItemSchema>

export const rfqSchema = z.object({
  requestType: z.enum(['PRODUCT', 'SERVICE']).default('PRODUCT'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().default('USD'),
  submissionDate: z.string().optional(),
  deadlineDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'ASSIGNED', 'QUOTES_RECEIVED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  lineItems: z.array(rfqLineItemSchema).optional(),
  assignedSupplierIds: z.array(z.string()).optional(),
})

export type RFQInput = z.infer<typeof rfqSchema>

export const rfqUpdateSchema = rfqSchema.partial()

export type RFQUpdateInput = z.infer<typeof rfqUpdateSchema>

// ==================== PROPOSAL VALIDATIONS ====================

export const proposalLineItemSchema = z.object({
  rfqLineItemId: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  totalPrice: z.number(),
  notes: z.string().optional(),
})

export type ProposalLineItemInput = z.infer<typeof proposalLineItemSchema>

export const proposalSchema = z.object({
  rfqId: z.string().min(1, 'RFQ is required'),
  lineItems: z.array(proposalLineItemSchema).optional(),
  subtotal: z.number().default(0),
  currency: z.string().default('USD'),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
  deliveryTerms: z.string().optional(),
  validity: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED']).default('DRAFT'),
  adminMargin: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  taxPercentage: z.number().min(0).max(100).default(0),
  termsConditions: z.string().optional(),
})

export type ProposalInput = z.infer<typeof proposalSchema>

export const proposalUpdateSchema = proposalSchema.partial().omit({ rfqId: true })

export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>

// ==================== PRODUCT VALIDATIONS ====================

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  currency: z.string().default('USD'),
  minimumOrderQuantity: z.number().positive().optional(),
  unit: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export type ProductInput = z.infer<typeof productSchema>

export const productUpdateSchema = productSchema.partial()

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

// ==================== NOTIFICATION VALIDATIONS ====================

export const notificationCreateSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
  link: z.string().optional(),
})

export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>

// ==================== FILE UPLOAD VALIDATION ====================

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'csv', 'txt', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar', '7z'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string().refine(
    (type) => ALLOWED_FILE_TYPES.includes(type) || type.startsWith('image/'),
    'File type not allowed'
  ),
  size: z.number().max(MAX_FILE_SIZE, 'File size must be less than 10MB'),
})

export const validateFileExtension = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false
}

export const validateFileSize = (size: number): boolean => {
  return size <= MAX_FILE_SIZE
}

// ==================== PAGINATION ====================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.infer<typeof paginationSchema>
