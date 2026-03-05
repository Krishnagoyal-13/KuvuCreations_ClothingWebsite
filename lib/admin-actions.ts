"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { BILLING_PRODUCT_TYPES } from "./billing-constants"
import { query } from "./db"

const ADMIN_COOKIE_NAME = "kuvu_admin_access"
const ADMIN_COOKIE_VALUE = "verified"

function getExpectedAdminPassword() {
  return process.env.ADMIN_BILLING_PASSWORD ?? "Hno-1617"
}

function normalizePaymentStatus(status: string) {
  return status === "paid" ? "paid" : "pending"
}

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizePhoneNumber(phone?: string | null) {
  const cleaned = (phone ?? "").trim()
  return cleaned.length > 0 ? cleaned : null
}

function normalizeProductType(productType?: string | null) {
  const normalized = (productType ?? "").trim().toLowerCase()
  const matched = BILLING_PRODUCT_TYPES.find((type) => type.toLowerCase() === normalized)
  return matched ?? BILLING_PRODUCT_TYPES[0]
}

export interface BillingCustomerOption {
  id: number
  fullName: string
  phoneNumber: string | null
  openingBalance: number
  lastInvoiceAt: string | null
}

export interface BillingInvoiceRecord {
  id: number
  customerId: number
  customerName: string
  customerPhone: string | null
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  paymentStatus: "pending" | "paid"
  taxEnabled: boolean
  createdAt: string
  itemCount: number
  itemsSummary: string
}

export interface BillingStockCategoryRecord {
  productType: string
  purchasedQty: number
  soldQty: number
  availableQty: number
}

export interface BillingDashboardData {
  customers: BillingCustomerOption[]
  invoices: BillingInvoiceRecord[]
  stockByCategory: BillingStockCategoryRecord[]
}

export interface BillingInvoiceItemInput {
  productName: string
  productType?: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  // Backward-compatible fallback if old clients still send value amount.
  discountValue?: number
  taxPercent?: number
}

export interface CreateBillingInvoiceInput {
  customerName: string
  customerPhone?: string
  items: BillingInvoiceItemInput[]
  taxEnabled?: boolean
  notes?: string
}

export interface UpsertBillingStockByCategoryInput {
  stocks: Array<{
    productType: string
    purchasedQty: number
  }>
}

export async function getAdminSessionStatus() {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE
}

export async function loginAdmin(password: string) {
  if (password !== getExpectedAdminPassword()) {
    return { success: false, error: "Incorrect admin password." }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
  revalidatePath("/admin")
  return { success: true }
}

async function requireAdminAccess() {
  const hasAccess = await getAdminSessionStatus()
  if (!hasAccess) {
    throw new Error("Unauthorized admin access")
  }
}

export async function getBillingDashboardData(): Promise<BillingDashboardData> {
  await requireAdminAccess()

  const customersResult = await query(
    `
      SELECT
        bc.id,
        bc.full_name,
        bc.phone_number,
        bc.opening_balance,
        MAX(bi.created_at) AS last_invoice_at
      FROM billing_customers bc
      LEFT JOIN billing_invoices bi ON bi.customer_id = bc.id
      GROUP BY bc.id, bc.full_name, bc.phone_number, bc.opening_balance
      ORDER BY bc.full_name ASC
    `,
  )

  const invoicesResult = await query(
    `
      SELECT
        bi.id,
        bc.id AS customer_id,
        bc.full_name AS customer_name,
        COALESCE(bi.customer_phone, bc.phone_number) AS customer_phone,
        bi.subtotal,
        bi.discount_total,
        bi.tax_total,
        bi.total,
        bi.payment_status,
        bi.tax_enabled,
        bi.created_at,
        COUNT(bii.id)::INTEGER AS item_count,
        COALESCE(
          STRING_AGG((bii.product_name || ' [' || bii.product_type || '] x' || bii.quantity::TEXT), ', ' ORDER BY bii.id),
          ''
        ) AS items_summary
      FROM billing_invoices bi
      JOIN billing_customers bc ON bc.id = bi.customer_id
      LEFT JOIN billing_invoice_items bii ON bii.invoice_id = bi.id
      GROUP BY
        bi.id,
        bc.id,
        bc.full_name,
        COALESCE(bi.customer_phone, bc.phone_number),
        bi.subtotal,
        bi.discount_total,
        bi.tax_total,
        bi.total,
        bi.payment_status,
        bi.tax_enabled,
        bi.created_at
      ORDER BY bi.created_at DESC
      LIMIT 300
    `,
  )

  const purchasedStockResult = await query(`
    SELECT product_type, purchased_qty
    FROM billing_stock_categories
  `)

  const soldStockResult = await query(`
    SELECT
      product_type,
      COALESCE(SUM(quantity), 0)::INTEGER AS sold_qty
    FROM billing_invoice_items
    GROUP BY product_type
  `)

  const purchasedByType = new Map<string, number>()
  for (const row of purchasedStockResult.rows) {
    const key = String(row.product_type).toLowerCase()
    purchasedByType.set(key, Number(row.purchased_qty ?? 0))
  }

  const soldByType = new Map<string, number>()
  for (const row of soldStockResult.rows) {
    const key = String(row.product_type).toLowerCase()
    soldByType.set(key, Number(row.sold_qty ?? 0))
  }

  const stockByCategory = BILLING_PRODUCT_TYPES.map((productType) => {
    const key = productType.toLowerCase()
    const purchasedQty = Math.max(0, purchasedByType.get(key) ?? 0)
    const soldQty = Math.max(0, soldByType.get(key) ?? 0)

    return {
      productType,
      purchasedQty,
      soldQty,
      availableQty: purchasedQty - soldQty,
    }
  })

  return {
    customers: customersResult.rows.map((row) => ({
      id: Number(row.id),
      fullName: row.full_name,
      phoneNumber: row.phone_number ?? null,
      openingBalance: Number.parseFloat(row.opening_balance ?? "0"),
      lastInvoiceAt: row.last_invoice_at ? new Date(row.last_invoice_at).toISOString() : null,
    })),
    invoices: invoicesResult.rows.map((row) => ({
      id: Number(row.id),
      customerId: Number(row.customer_id),
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? null,
      subtotal: Number.parseFloat(row.subtotal),
      discountTotal: Number.parseFloat(row.discount_total),
      taxTotal: Number.parseFloat(row.tax_total),
      total: Number.parseFloat(row.total),
      paymentStatus: normalizePaymentStatus(row.payment_status) as "pending" | "paid",
      taxEnabled: row.tax_enabled === true,
      createdAt: new Date(row.created_at).toISOString(),
      itemCount: Number(row.item_count ?? 0),
      itemsSummary: row.items_summary || "",
    })),
    stockByCategory,
  }
}

export async function createBillingInvoice(input: CreateBillingInvoiceInput) {
  await requireAdminAccess()

  const customerName = input.customerName?.trim()
  if (!customerName) {
    return { success: false, error: "Customer name is required." }
  }

  const customerPhone = normalizePhoneNumber(input.customerPhone)
  const taxEnabled = input.taxEnabled === true
  const items = (input.items || [])
    .map((item) => ({
      productName: item.productName?.trim(),
      productType: normalizeProductType(item.productType),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountPercent: Number(item.discountPercent ?? item.discountValue ?? 0),
      taxPercent: Number(item.taxPercent ?? 0),
    }))
    .filter((item) => item.productName && item.quantity > 0 && item.unitPrice >= 0)

  if (items.length === 0) {
    return { success: false, error: "At least one valid billing item is required." }
  }

  const calculatedItems = items.map((item) => {
    const baseTotal = toMoney(item.quantity * item.unitPrice)
    const discountPercent = Math.min(Math.max(item.discountPercent, 0), 100)
    const discountValue = toMoney((baseTotal * discountPercent) / 100)
    const taxableAmount = toMoney(baseTotal - discountValue)
    const taxPercent = taxEnabled ? Math.max(item.taxPercent, 0) : 0
    const taxAmount = toMoney((taxableAmount * taxPercent) / 100)
    const lineTotal = toMoney(taxableAmount + taxAmount)

    return {
      ...item,
      baseTotal,
      discountPercent,
      discountValue,
      taxPercent,
      taxAmount,
      lineTotal,
    }
  })

  const notes = input.notes?.trim() || null
  const subtotal = toMoney(calculatedItems.reduce((sum, item) => sum + item.baseTotal, 0))
  const discountTotal = toMoney(calculatedItems.reduce((sum, item) => sum + item.discountValue, 0))
  const taxTotal = toMoney(calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0))
  const total = toMoney(subtotal - discountTotal + taxTotal)

  let invoiceId: number | null = null

  try {
    await query("BEGIN")

    const customerResult = await query("SELECT id FROM billing_customers WHERE LOWER(full_name) = LOWER($1) LIMIT 1", [
      customerName,
    ])

    let customerId: number
    if (customerResult.rows.length > 0) {
      customerId = Number(customerResult.rows[0].id)
      await query(
        "UPDATE billing_customers SET phone_number = COALESCE($1, phone_number), updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [customerPhone, customerId],
      )
    } else {
      const newCustomerResult = await query(
        `
          INSERT INTO billing_customers (full_name, phone_number, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          RETURNING id
        `,
        [customerName, customerPhone],
      )
      customerId = Number(newCustomerResult.rows[0].id)
    }

    const invoiceResult = await query(
      `
        INSERT INTO billing_invoices (
          customer_id,
          subtotal,
          discount_total,
          tax_total,
          total,
          tax_enabled,
          customer_phone,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        customerId,
        subtotal.toFixed(2),
        discountTotal.toFixed(2),
        taxTotal.toFixed(2),
        total.toFixed(2),
        taxEnabled,
        customerPhone,
        notes,
      ],
    )
    invoiceId = Number(invoiceResult.rows[0].id)

    for (const item of calculatedItems) {
      await query(
        `
          INSERT INTO billing_invoice_items (
            invoice_id,
            product_name,
            product_type,
            quantity,
            unit_price,
            base_total,
            discount_value,
            tax_percent,
            tax_amount,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          invoiceId,
          item.productName,
          item.productType,
          item.quantity,
          item.unitPrice.toFixed(2),
          item.baseTotal.toFixed(2),
          item.discountValue.toFixed(2),
          item.taxPercent.toFixed(2),
          item.taxAmount.toFixed(2),
          item.lineTotal.toFixed(2),
        ],
      )
    }

    await query("COMMIT")
    revalidatePath("/admin")

    return { success: true, invoiceId }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while creating invoice:", rollbackError)
    }
    console.error("Create invoice error:", error)
    return { success: false, error: "Could not create bill. Check database connection." }
  }
}

export interface UpsertCustomerOpeningBalanceInput {
  customerName: string
  openingBalance: number
  customerId?: number | null
}

export async function upsertCustomerOpeningBalance(input: UpsertCustomerOpeningBalanceInput) {
  await requireAdminAccess()

  const customerName = input.customerName?.trim()
  if (!customerName) {
    return { success: false, error: "Customer name is required." }
  }

  const openingBalance = toMoney(Number(input.openingBalance))
  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return { success: false, error: "Opening balance must be 0 or higher." }
  }

  let savedCustomerId: number | null = Number.isFinite(Number(input.customerId)) ? Number(input.customerId) : null

  try {
    await query("BEGIN")

    if (savedCustomerId && savedCustomerId > 0) {
      const existingById = await query("SELECT id FROM billing_customers WHERE id = $1 LIMIT 1", [savedCustomerId])
      if (existingById.rows.length === 0) {
        savedCustomerId = null
      }
    } else {
      savedCustomerId = null
    }

    if (!savedCustomerId) {
      const existingByName = await query(
        "SELECT id FROM billing_customers WHERE LOWER(full_name) = LOWER($1) LIMIT 1",
        [customerName],
      )
      if (existingByName.rows.length > 0) {
        savedCustomerId = Number(existingByName.rows[0].id)
      }
    }

    if (savedCustomerId) {
      await query(
        `
          UPDATE billing_customers
          SET full_name = $1, opening_balance = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [customerName, openingBalance.toFixed(2), savedCustomerId],
      )
    } else {
      const createdCustomer = await query(
        `
          INSERT INTO billing_customers (full_name, opening_balance, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          RETURNING id
        `,
        [customerName, openingBalance.toFixed(2)],
      )
      savedCustomerId = Number(createdCustomer.rows[0].id)
    }

    await query("COMMIT")
    revalidatePath("/admin")
    return { success: true, customerId: savedCustomerId }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while saving opening balance:", rollbackError)
    }
    console.error("Save opening balance error:", error)
    return { success: false, error: "Could not save opening balance." }
  }
}

export async function upsertBillingStockByCategory(input: UpsertBillingStockByCategoryInput) {
  await requireAdminAccess()

  const mapByType = new Map<string, number>()

  for (const stockRow of input.stocks ?? []) {
    const productType = normalizeProductType(stockRow.productType)
    const purchasedQty = Math.max(0, Math.floor(Number(stockRow.purchasedQty) || 0))
    mapByType.set(productType.toLowerCase(), purchasedQty)
  }

  try {
    await query("BEGIN")

    for (const productType of BILLING_PRODUCT_TYPES) {
      const purchasedQty = mapByType.get(productType.toLowerCase()) ?? 0
      await query(
        `
          INSERT INTO billing_stock_categories (product_type, purchased_qty, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (product_type)
          DO UPDATE SET purchased_qty = EXCLUDED.purchased_qty, updated_at = CURRENT_TIMESTAMP
        `,
        [productType, purchasedQty],
      )
    }

    await query("COMMIT")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while saving stock by category:", rollbackError)
    }
    console.error("Save stock by category error:", error)
    return { success: false, error: "Could not save stock by category." }
  }
}

export async function updateBillingPaymentStatus(invoiceId: number, status: "pending" | "paid") {
  await requireAdminAccess()

  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return { success: false, error: "Invalid invoice id." }
  }

  const paymentStatus = normalizePaymentStatus(status)

  try {
    await query("UPDATE billing_invoices SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      paymentStatus,
      invoiceId,
    ])
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Update payment status error:", error)
    return { success: false, error: "Could not update payment status." }
  }
}
