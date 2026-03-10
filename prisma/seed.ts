/**
 * Database Seed Script
 *
 * Creates initial test data for development.
 * Idempotent: Can be run multiple times safely without duplicating data.
 */

import { PrismaClient, UserRole, RFQRequestType, RFQStatus, ProposalStatus, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BCRYPT_SALT_ROUNDS = 12

// Helper to generate request numbers
function generateRequestNumber(year: number, sequence: number): string {
  return `RFQ-${year}-${sequence.toString().padStart(5, '0')}`
}

function generateProposalNumber(year: number, sequence: number): string {
  return `PROP-${year}-${sequence.toString().padStart(5, '0')}`
}

async function main() {
  console.log('Starting seed...')
  console.log('')

  // ==================== USERS ====================
  console.log('Creating/Updating users...')

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', BCRYPT_SALT_ROUNDS)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nearsupply.com' },
    update: {
      name: 'Admin User',
      company: 'NearSupply',
      phone: '+1 555 0100',
      isActive: true,
    },
    create: {
      email: 'admin@nearsupply.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      company: 'NearSupply',
      phone: '+1 555 0100',
      isActive: true,
    },
  })
  console.log(`  ✓ Admin: ${admin.email}`)

  // Supplier user
  const supplierPassword = await bcrypt.hash('supplier123', BCRYPT_SALT_ROUNDS)
  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@example.com' },
    update: {
      name: 'John Supplier',
      company: 'Quality Supplies Inc.',
      phone: '+1 555 0101',
      isActive: true,
    },
    create: {
      email: 'supplier@example.com',
      password: supplierPassword,
      name: 'John Supplier',
      role: UserRole.SUPPLIER,
      company: 'Quality Supplies Inc.',
      phone: '+1 555 0101',
      isActive: true,
    },
  })
  console.log(`  ✓ Supplier: ${supplier.email}`)

  // Second supplier (for variety)
  const supplier2Password = await bcrypt.hash('supplier123', BCRYPT_SALT_ROUNDS)
  const supplier2 = await prisma.user.upsert({
    where: { email: 'supplier2@example.com' },
    update: {
      name: 'Jane Supplier',
      company: 'Global Parts Co.',
      phone: '+1 555 0102',
      isActive: true,
    },
    create: {
      email: 'supplier2@example.com',
      password: supplier2Password,
      name: 'Jane Supplier',
      role: UserRole.SUPPLIER,
      company: 'Global Parts Co.',
      phone: '+1 555 0102',
      isActive: true,
    },
  })
  console.log(`  ✓ Supplier 2: ${supplier2.email}`)

  // Client user
  const clientPassword = await bcrypt.hash('client123', BCRYPT_SALT_ROUNDS)
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {
      name: 'Alice Client',
      company: 'Acme Corporation',
      phone: '+1 555 0200',
      isActive: true,
    },
    create: {
      email: 'client@example.com',
      password: clientPassword,
      name: 'Alice Client',
      role: UserRole.CLIENT,
      company: 'Acme Corporation',
      phone: '+1 555 0200',
      isActive: true,
    },
  })
  console.log(`  ✓ Client: ${client.email}`)

  // Second client (for variety)
  const client2Password = await bcrypt.hash('client123', BCRYPT_SALT_ROUNDS)
  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {
      name: 'Bob Client',
      company: 'TechStart Inc.',
      phone: '+1 555 0201',
      isActive: true,
    },
    create: {
      email: 'client2@example.com',
      password: client2Password,
      name: 'Bob Client',
      role: UserRole.CLIENT,
      company: 'TechStart Inc.',
      phone: '+1 555 0201',
      isActive: true,
    },
  })
  console.log(`  ✓ Client 2: ${client2.email}`)

  console.log('')

  // ==================== PRODUCTS ====================
  console.log('Creating/Updating products...')

  // Products for supplier 1
  const productsData = [
    {
      sku: 'QSI-DESK-001',
      supplierId: supplier.id,
      name: 'Executive Office Desk',
      description: 'Premium executive desk with built-in cable management and storage drawers.',
      category: 'office_furniture',
      unitPrice: 599,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: true,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'QSI-CHAIR-001',
      supplierId: supplier.id,
      name: 'Ergonomic Chair Pro',
      description: 'Full-featured ergonomic office chair with adjustable lumbar support and armrests.',
      category: 'office_furniture',
      unitPrice: 449,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: true,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'QSI-CAB-001',
      supplierId: supplier.id,
      name: 'Filing Cabinet 4-Drawer',
      description: 'Industrial-grade filing cabinet with lock and anti-tip mechanism.',
      category: 'office_furniture',
      unitPrice: 189,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'QSI-DESK-002',
      supplierId: supplier.id,
      name: 'Standing Desk Electric',
      description: 'Height-adjustable standing desk with memory presets and cable management.',
      category: 'office_furniture',
      unitPrice: 799,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: true,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'QSI-CHAIR-002',
      supplierId: supplier.id,
      name: 'Conference Chair',
      description: 'Professional conference room chair with padded seat and back.',
      category: 'office_furniture',
      unitPrice: 249,
      currency: 'USD',
      minimumOrderQuantity: 4,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.ACTIVE,
    },
  ]

  // Products for supplier 2
  productsData.push(
    {
      sku: 'GPC-LAPTOP-001',
      supplierId: supplier2.id,
      name: 'Business Laptop Pro',
      description: 'High-performance business laptop with Intel i7, 16GB RAM, 512GB SSD.',
      category: 'it_equipment',
      unitPrice: 1299,
      currency: 'USD',
      minimumOrderQuantity: 5,
      unit: 'pcs',
      isFeatured: true,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'GPC-MON-001',
      supplierId: supplier2.id,
      name: '27" 4K Monitor',
      description: 'Professional-grade 4K monitor with USB-C connectivity and adjustable stand.',
      category: 'it_equipment',
      unitPrice: 399,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'GPC-DOCK-001',
      supplierId: supplier2.id,
      name: 'USB-C Docking Station',
      description: 'Universal docking station with dual monitor support and 100W power delivery.',
      category: 'it_equipment',
      unitPrice: 179,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'GPC-WEBCAM-001',
      supplierId: supplier2.id,
      name: 'HD Webcam Pro',
      description: '1080p HD webcam with auto-focus and built-in microphone.',
      category: 'it_equipment',
      unitPrice: 89,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.ACTIVE,
    },
    {
      sku: 'GPC-KEYBOARD-001',
      supplierId: supplier2.id,
      name: 'Wireless Mechanical Keyboard',
      description: 'Bluetooth mechanical keyboard with RGB backlight and ergonomic design.',
      category: 'it_equipment',
      unitPrice: 129,
      currency: 'USD',
      minimumOrderQuantity: 1,
      unit: 'pcs',
      isFeatured: false,
      status: ProductStatus.INACTIVE,
    }
  )

  // Upsert products by SKU
  let productsCreated = 0
  let productsUpdated = 0
  for (const productData of productsData) {
    const existing = await prisma.product.findFirst({
      where: { sku: productData.sku },
    })
    
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      })
      productsUpdated++
    } else {
      await prisma.product.create({
        data: productData,
      })
      productsCreated++
    }
  }
  console.log(`  ✓ Products: ${productsCreated} created, ${productsUpdated} updated`)
  console.log('')

  // ==================== RFQ REQUESTS ====================
  console.log('Creating/Updating RFQ requests...')

  const currentYear = new Date().getFullYear()

  // RFQ 1 - Office Furniture (Submitted, multiple proposals possible)
  const rfq1Number = generateRequestNumber(currentYear, 1)
  const rfq1 = await prisma.rFQRequest.upsert({
    where: { requestNumber: rfq1Number },
    update: {
      title: 'Office Furniture Procurement',
      description: 'Looking for office desks, chairs, and storage cabinets for a new office setup. We need approximately 50 workstations.',
      category: 'office_furniture',
      budget: 50000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      deliveryTerms: 'FOB Destination',
      deliveryAddress: '123 Business Park, Suite 400, New York, NY 10001',
      notes: 'All items should come with a minimum 2-year warranty.',
      status: RFQStatus.QUOTES_RECEIVED,
    },
    create: {
      requestNumber: rfq1Number,
      requestType: RFQRequestType.PRODUCT,
      title: 'Office Furniture Procurement',
      description: 'Looking for office desks, chairs, and storage cabinets for a new office setup. We need approximately 50 workstations.',
      category: 'office_furniture',
      budget: 50000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      deliveryTerms: 'FOB Destination',
      deliveryAddress: '123 Business Park, Suite 400, New York, NY 10001',
      notes: 'All items should come with a minimum 2-year warranty.',
      status: RFQStatus.QUOTES_RECEIVED,
      clientId: client.id,
    },
  })

  // Create line items for RFQ1 if not exist
  const rfq1ItemsCount = await prisma.rFQItem.count({ where: { rfqRequestId: rfq1.id } })
  if (rfq1ItemsCount === 0) {
    await prisma.rFQItem.createMany({
      data: [
        { rfqRequestId: rfq1.id, name: 'Executive Desk', quantity: 10, unit: 'pcs', specifications: '180cm x 90cm, with cable management', sortOrder: 0 },
        { rfqRequestId: rfq1.id, name: 'Standard Workstation Desk', quantity: 40, unit: 'pcs', specifications: '140cm x 70cm, modular design', sortOrder: 1 },
        { rfqRequestId: rfq1.id, name: 'Ergonomic Office Chair', quantity: 50, unit: 'pcs', specifications: 'Adjustable height, lumbar support', sortOrder: 2 },
        { rfqRequestId: rfq1.id, name: 'Filing Cabinet', quantity: 20, unit: 'pcs', specifications: '4-drawer, lockable', sortOrder: 3 },
      ],
    })
  }
  console.log(`  ✓ RFQ 1: ${rfq1.requestNumber} - ${rfq1.title}`)

  // RFQ 2 - IT Services (Assigned)
  const rfq2Number = generateRequestNumber(currentYear, 2)
  const rfq2 = await prisma.rFQRequest.upsert({
    where: { requestNumber: rfq2Number },
    update: {
      title: 'IT Support Services',
      description: 'Annual IT support and maintenance services for our office infrastructure.',
      category: 'it_services',
      budget: 25000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      deliveryTerms: 'On-site + Remote Support',
      notes: '24/7 support required for critical systems.',
      status: RFQStatus.ASSIGNED,
    },
    create: {
      requestNumber: rfq2Number,
      requestType: RFQRequestType.SERVICE,
      title: 'IT Support Services',
      description: 'Annual IT support and maintenance services for our office infrastructure.',
      category: 'it_services',
      budget: 25000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      deliveryTerms: 'On-site + Remote Support',
      notes: '24/7 support required for critical systems.',
      status: RFQStatus.ASSIGNED,
      clientId: client.id,
    },
  })

  const rfq2ItemsCount = await prisma.rFQItem.count({ where: { rfqRequestId: rfq2.id } })
  if (rfq2ItemsCount === 0) {
    await prisma.rFQItem.createMany({
      data: [
        { rfqRequestId: rfq2.id, name: 'Help Desk Support', quantity: 1, unit: 'year', specifications: '24/7 support, 4-hour response time', sortOrder: 0 },
        { rfqRequestId: rfq2.id, name: 'Server Maintenance', quantity: 12, unit: 'months', specifications: 'Monthly preventive maintenance', sortOrder: 1 },
        { rfqRequestId: rfq2.id, name: 'Network Monitoring', quantity: 1, unit: 'year', specifications: 'Real-time monitoring and alerts', sortOrder: 2 },
      ],
    })
  }
  console.log(`  ✓ RFQ 2: ${rfq2.requestNumber} - ${rfq2.title}`)

  // RFQ 3 - Computer Equipment (Draft)
  const rfq3Number = generateRequestNumber(currentYear, 3)
  const rfq3 = await prisma.rFQRequest.upsert({
    where: { requestNumber: rfq3Number },
    update: {
      title: 'Computer Equipment',
      description: 'Laptops and monitors for new employees joining Q2.',
      category: 'it_equipment',
      budget: 30000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: RFQStatus.DRAFT,
    },
    create: {
      requestNumber: rfq3Number,
      requestType: RFQRequestType.PRODUCT,
      title: 'Computer Equipment',
      description: 'Laptops and monitors for new employees joining Q2.',
      category: 'it_equipment',
      budget: 30000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: RFQStatus.DRAFT,
      clientId: client.id,
    },
  })

  const rfq3ItemsCount = await prisma.rFQItem.count({ where: { rfqRequestId: rfq3.id } })
  if (rfq3ItemsCount === 0) {
    await prisma.rFQItem.createMany({
      data: [
        { rfqRequestId: rfq3.id, name: 'Business Laptop', quantity: 25, unit: 'pcs', specifications: 'Intel i7, 16GB RAM, 512GB SSD', sortOrder: 0 },
        { rfqRequestId: rfq3.id, name: 'External Monitor', quantity: 25, unit: 'pcs', specifications: '27" 4K, adjustable stand', sortOrder: 1 },
      ],
    })
  }
  console.log(`  ✓ RFQ 3: ${rfq3.requestNumber} - ${rfq3.title}`)

  // RFQ 4 - Office Supplies (Submitted, from client 2)
  const rfq4Number = generateRequestNumber(currentYear, 4)
  const rfq4 = await prisma.rFQRequest.upsert({
    where: { requestNumber: rfq4Number },
    update: {
      title: 'Office Supplies Q1',
      description: 'General office supplies for the first quarter.',
      category: 'office_supplies',
      budget: 5000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Delivery required within 5 business days of order confirmation.',
      status: RFQStatus.SUBMITTED,
    },
    create: {
      requestNumber: rfq4Number,
      requestType: RFQRequestType.PRODUCT,
      title: 'Office Supplies Q1',
      description: 'General office supplies for the first quarter.',
      category: 'office_supplies',
      budget: 5000,
      currency: 'USD',
      deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Delivery required within 5 business days of order confirmation.',
      status: RFQStatus.SUBMITTED,
      clientId: client2.id,
    },
  })

  const rfq4ItemsCount = await prisma.rFQItem.count({ where: { rfqRequestId: rfq4.id } })
  if (rfq4ItemsCount === 0) {
    await prisma.rFQItem.createMany({
      data: [
        { rfqRequestId: rfq4.id, name: 'Printer Paper A4', quantity: 100, unit: 'reams', specifications: '80gsm, white', sortOrder: 0 },
        { rfqRequestId: rfq4.id, name: 'Ballpoint Pens', quantity: 200, unit: 'pcs', specifications: 'Blue ink, medium point', sortOrder: 1 },
        { rfqRequestId: rfq4.id, name: 'Sticky Notes', quantity: 50, unit: 'packs', specifications: 'Assorted colors', sortOrder: 2 },
        { rfqRequestId: rfq4.id, name: 'File Folders', quantity: 100, unit: 'pcs', specifications: 'Letter size, manila', sortOrder: 3 },
      ],
    })
  }
  console.log(`  ✓ RFQ 4: ${rfq4.requestNumber} - ${rfq4.title}`)

  // RFQ 5 - Completed RFQ
  const rfq5Number = generateRequestNumber(currentYear, 5)
  const rfq5 = await prisma.rFQRequest.upsert({
    where: { requestNumber: rfq5Number },
    update: {
      title: 'Marketing Materials',
      description: 'Printed brochures and business cards for marketing campaign.',
      category: 'marketing',
      budget: 8000,
      currency: 'USD',
      status: RFQStatus.COMPLETED,
    },
    create: {
      requestNumber: rfq5Number,
      requestType: RFQRequestType.SERVICE,
      title: 'Marketing Materials',
      description: 'Printed brochures and business cards for marketing campaign.',
      category: 'marketing',
      budget: 8000,
      currency: 'USD',
      status: RFQStatus.COMPLETED,
      clientId: client.id,
    },
  })

  const rfq5ItemsCount = await prisma.rFQItem.count({ where: { rfqRequestId: rfq5.id } })
  if (rfq5ItemsCount === 0) {
    await prisma.rFQItem.createMany({
      data: [
        { rfqRequestId: rfq5.id, name: 'Company Brochures', quantity: 5000, unit: 'pcs', specifications: 'A4 folded, full color, 170gsm gloss', sortOrder: 0 },
        { rfqRequestId: rfq5.id, name: 'Business Cards', quantity: 2000, unit: 'pcs', specifications: 'Standard size, full color both sides, matte finish', sortOrder: 1 },
      ],
    })
  }
  console.log(`  ✓ RFQ 5: ${rfq5.requestNumber} - ${rfq5.title}`)

  console.log('')

  // ==================== PROPOSALS ====================
  console.log('Creating/Updating proposals...')

  // Proposal 1 - For RFQ 2 (IT Services)
  const prop1Number = generateProposalNumber(currentYear, 1)
  const proposal1 = await prisma.proposal.upsert({
    where: { proposalNumber: prop1Number },
    update: {
      lineItems: JSON.stringify([
        { name: 'Help Desk Support', quantity: 1, unit: 'year', unitPrice: 15000, totalPrice: 15000 },
        { name: 'Server Maintenance', quantity: 12, unit: 'months', unitPrice: 500, totalPrice: 6000 },
        { name: 'Network Monitoring', quantity: 1, unit: 'year', unitPrice: 3000, totalPrice: 3000 },
      ]),
      subtotal: 24000,
      currency: 'USD',
      deliveryTerms: 'On-site and remote support included',
      validity: 30,
      status: ProposalStatus.SUBMITTED,
      adminMargin: 0,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 24000,
      termsConditions: 'Payment terms: Net 30. Contract renewal options available.',
    },
    create: {
      proposalNumber: prop1Number,
      rfqRequestId: rfq2.id,
      supplierId: supplier.id,
      lineItems: JSON.stringify([
        { name: 'Help Desk Support', quantity: 1, unit: 'year', unitPrice: 15000, totalPrice: 15000 },
        { name: 'Server Maintenance', quantity: 12, unit: 'months', unitPrice: 500, totalPrice: 6000 },
        { name: 'Network Monitoring', quantity: 1, unit: 'year', unitPrice: 3000, totalPrice: 3000 },
      ]),
      subtotal: 24000,
      currency: 'USD',
      deliveryTerms: 'On-site and remote support included',
      validity: 30,
      status: ProposalStatus.SUBMITTED,
      adminMargin: 0,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 24000,
      termsConditions: 'Payment terms: Net 30. Contract renewal options available.',
    },
  })
  console.log(`  ✓ Proposal 1: ${proposal1.proposalNumber} for RFQ ${rfq2.requestNumber}`)

  // Proposal 2 - For RFQ 1 (Office Furniture) from Supplier 1
  const prop2Number = generateProposalNumber(currentYear, 2)
  const proposal2 = await prisma.proposal.upsert({
    where: { proposalNumber: prop2Number },
    update: {
      lineItems: JSON.stringify([
        { name: 'Executive Desk', quantity: 10, unit: 'pcs', unitPrice: 550, totalPrice: 5500 },
        { name: 'Standard Workstation Desk', quantity: 40, unit: 'pcs', unitPrice: 320, totalPrice: 12800 },
        { name: 'Ergonomic Office Chair', quantity: 50, unit: 'pcs', unitPrice: 425, totalPrice: 21250 },
        { name: 'Filing Cabinet', quantity: 20, unit: 'pcs', unitPrice: 175, totalPrice: 3500 },
      ]),
      subtotal: 43050,
      currency: 'USD',
      deliveryTerms: 'FOB Destination, included in price',
      validity: 45,
      status: ProposalStatus.SUBMITTED,
      notes: 'Volume discount applied. Includes assembly and installation.',
      adminMargin: 0,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 43050,
    },
    create: {
      proposalNumber: prop2Number,
      rfqRequestId: rfq1.id,
      supplierId: supplier.id,
      lineItems: JSON.stringify([
        { name: 'Executive Desk', quantity: 10, unit: 'pcs', unitPrice: 550, totalPrice: 5500 },
        { name: 'Standard Workstation Desk', quantity: 40, unit: 'pcs', unitPrice: 320, totalPrice: 12800 },
        { name: 'Ergonomic Office Chair', quantity: 50, unit: 'pcs', unitPrice: 425, totalPrice: 21250 },
        { name: 'Filing Cabinet', quantity: 20, unit: 'pcs', unitPrice: 175, totalPrice: 3500 },
      ]),
      subtotal: 43050,
      currency: 'USD',
      deliveryTerms: 'FOB Destination, included in price',
      validity: 45,
      status: ProposalStatus.SUBMITTED,
      notes: 'Volume discount applied. Includes assembly and installation.',
      adminMargin: 0,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 43050,
    },
  })
  console.log(`  ✓ Proposal 2: ${proposal2.proposalNumber} for RFQ ${rfq1.requestNumber}`)

  // Proposal 3 - For RFQ 1 (Office Furniture) from Supplier 2 - ACCEPTED
  const prop3Number = generateProposalNumber(currentYear, 3)
  const proposal3 = await prisma.proposal.upsert({
    where: { proposalNumber: prop3Number },
    update: {
      lineItems: JSON.stringify([
        { name: 'Executive Desk', quantity: 10, unit: 'pcs', unitPrice: 520, totalPrice: 5200 },
        { name: 'Standard Workstation Desk', quantity: 40, unit: 'pcs', unitPrice: 300, totalPrice: 12000 },
        { name: 'Ergonomic Office Chair', quantity: 50, unit: 'pcs', unitPrice: 400, totalPrice: 20000 },
        { name: 'Filing Cabinet', quantity: 20, unit: 'pcs', unitPrice: 165, totalPrice: 3300 },
      ]),
      subtotal: 40500,
      currency: 'USD',
      deliveryTerms: 'FOB Destination, free shipping',
      validity: 30,
      status: ProposalStatus.ACCEPTED,
      notes: 'Premium quality guarantee. Free shipping nationwide.',
      adminMargin: 2000,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 42500,
      isShared: true,
      sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    create: {
      proposalNumber: prop3Number,
      rfqRequestId: rfq1.id,
      supplierId: supplier2.id,
      lineItems: JSON.stringify([
        { name: 'Executive Desk', quantity: 10, unit: 'pcs', unitPrice: 520, totalPrice: 5200 },
        { name: 'Standard Workstation Desk', quantity: 40, unit: 'pcs', unitPrice: 300, totalPrice: 12000 },
        { name: 'Ergonomic Office Chair', quantity: 50, unit: 'pcs', unitPrice: 400, totalPrice: 20000 },
        { name: 'Filing Cabinet', quantity: 20, unit: 'pcs', unitPrice: 165, totalPrice: 3300 },
      ]),
      subtotal: 40500,
      currency: 'USD',
      deliveryTerms: 'FOB Destination, free shipping',
      validity: 30,
      status: ProposalStatus.ACCEPTED,
      notes: 'Premium quality guarantee. Free shipping nationwide.',
      adminMargin: 2000,
      shippingCost: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 42500,
      isShared: true,
      sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })
  console.log(`  ✓ Proposal 3: ${proposal3.proposalNumber} for RFQ ${rfq1.requestNumber} (ACCEPTED)`)

  // Proposal 4 - Draft proposal for RFQ 4
  const prop4Number = generateProposalNumber(currentYear, 4)
  const proposal4 = await prisma.proposal.upsert({
    where: { proposalNumber: prop4Number },
    update: {
      lineItems: JSON.stringify([
        { name: 'Printer Paper A4', quantity: 100, unit: 'reams', unitPrice: 6.5, totalPrice: 650 },
        { name: 'Ballpoint Pens', quantity: 200, unit: 'pcs', unitPrice: 0.75, totalPrice: 150 },
        { name: 'Sticky Notes', quantity: 50, unit: 'packs', unitPrice: 3.5, totalPrice: 175 },
        { name: 'File Folders', quantity: 100, unit: 'pcs', unitPrice: 0.45, totalPrice: 45 },
      ]),
      subtotal: 1020,
      currency: 'USD',
      validity: 14,
      status: ProposalStatus.DRAFT,
      notes: 'Bulk pricing available for quarterly orders.',
      adminMargin: 0,
      shippingCost: 50,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 1070,
    },
    create: {
      proposalNumber: prop4Number,
      rfqRequestId: rfq4.id,
      supplierId: supplier.id,
      lineItems: JSON.stringify([
        { name: 'Printer Paper A4', quantity: 100, unit: 'reams', unitPrice: 6.5, totalPrice: 650 },
        { name: 'Ballpoint Pens', quantity: 200, unit: 'pcs', unitPrice: 0.75, totalPrice: 150 },
        { name: 'Sticky Notes', quantity: 50, unit: 'packs', unitPrice: 3.5, totalPrice: 175 },
        { name: 'File Folders', quantity: 100, unit: 'pcs', unitPrice: 0.45, totalPrice: 45 },
      ]),
      subtotal: 1020,
      currency: 'USD',
      validity: 14,
      status: ProposalStatus.DRAFT,
      notes: 'Bulk pricing available for quarterly orders.',
      adminMargin: 0,
      shippingCost: 50,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 1070,
    },
  })
  console.log(`  ✓ Proposal 4: ${proposal4.proposalNumber} for RFQ ${rfq4.requestNumber} (DRAFT)`)

  console.log('')

  // ==================== NOTIFICATIONS ====================
  console.log('Creating notifications...')

  // Clear old notifications first to avoid duplicates
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [admin.id, client.id, client2.id, supplier.id, supplier2.id] },
    },
  })

  await prisma.notification.createMany({
    data: [
      // Client notifications
      {
        userId: client.id,
        title: 'New Proposal Received',
        message: `A new proposal has been submitted for your RFQ "${rfq2.title}".`,
        type: 'INFO',
        isRead: false,
        link: `#proposals`,
      },
      {
        userId: client.id,
        title: 'Proposal Accepted',
        message: `Your RFQ "${rfq1.title}" has an accepted proposal.`,
        type: 'SUCCESS',
        isRead: true,
        link: `#rfq`,
      },
      // Client 2 notifications
      {
        userId: client2.id,
        title: 'RFQ Submitted',
        message: `Your RFQ "${rfq4.title}" has been submitted successfully.`,
        type: 'SUCCESS',
        isRead: false,
        link: `#rfq`,
      },
      // Supplier notifications
      {
        userId: supplier.id,
        title: 'RFQ Assigned',
        message: `You have been assigned to RFQ "${rfq2.title}".`,
        type: 'INFO',
        isRead: false,
        link: `#rfq`,
      },
      {
        userId: supplier.id,
        title: 'New RFQ Available',
        message: `A new RFQ "${rfq4.title}" is available for bidding.`,
        type: 'INFO',
        isRead: true,
        link: `#rfq`,
      },
      // Supplier 2 notifications
      {
        userId: supplier2.id,
        title: 'Proposal Accepted',
        message: `Your proposal for "${rfq1.title}" has been accepted!`,
        type: 'SUCCESS',
        isRead: false,
        link: `#proposals`,
      },
      // Admin notifications
      {
        userId: admin.id,
        title: 'System Setup Complete',
        message: 'The NearSupply platform has been successfully set up.',
        type: 'SUCCESS',
        isRead: true,
      },
      {
        userId: admin.id,
        title: 'New User Registration',
        message: 'New client user registered: client2@example.com',
        type: 'INFO',
        isRead: false,
        link: `#users`,
      },
    ],
  })
  console.log('  ✓ Notifications created')

  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('                 SEED COMPLETE')
  console.log('═══════════════════════════════════════════════════')
  console.log('')
  console.log('📋 TEST USERS:')
  console.log('  ┌─────────────────────────────────────────────────┐')
  console.log('  │ Admin:    admin@nearsupply.com / admin123       │')
  console.log('  │ Supplier: supplier@example.com / supplier123    │')
  console.log('  │ Supplier: supplier2@example.com / supplier123   │')
  console.log('  │ Client:   client@example.com / client123        │')
  console.log('  │ Client:   client2@example.com / client123       │')
  console.log('  └─────────────────────────────────────────────────┘')
  console.log('')
  console.log('📊 SAMPLE DATA:')
  console.log(`  • ${(await prisma.product.count())} products`)
  console.log(`  • ${(await prisma.rFQRequest.count())} RFQ requests`)
  console.log(`  • ${(await prisma.proposal.count())} proposals`)
  console.log(`  • ${(await prisma.notification.count())} notifications`)
  console.log('')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
