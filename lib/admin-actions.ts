"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { query } from "./db"

const ADMIN_COOKIE_NAME = "kuvu_admin_access"
const ADMIN_COOKIE_VALUE = "verified"

function getExpectedAdminPassword() {
  return process.env.ADMIN_BILLING_PASSWORD ?? "Hno-1617"
}

function normalizePaymentStatus(status: string) {
  return status === "paid" ? "paid" : "pending"
}

export interface BillingCustomerOption {
  id: number
  fullName: string
  lastInvoiceAt: string | null
}

export interface BillingInvoiceRecord {
  id: number
  customerName: string
  total: number
  paymentStatus: "pending" | "paid"
  createdAt: string
  itemCount: number
  itemsSummary: string
}

export interface BillingDashboardData {
  customers: BillingCustomerOption[]
  invoices: BillingInvoiceRecord[]
}

export interface BillingInvoiceItemInput {
  productName: string
  quantity: number
  unitPrice: number
}

export interface CreateBillingInvoiceInput {
  customerName: string
  items: BillingInvoiceItemInput[]
  notes?: string
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
        MAX(bi.created_at) AS last_invoice_at
      FROM billing_customers bc
      LEFT JOIN billing_invoices bi ON bi.customer_id = bc.id
      GROUP BY bc.id, bc.full_name
      ORDER BY bc.full_name ASC
    `,
  )

  const invoicesResult = await query(
    `
      SELECT
        bi.id,
        bc.full_name AS customer_name,
        bi.total,
        bi.payment_status,
        bi.created_at,
        COUNT(bii.id)::INTEGER AS item_count,
        COALESCE(
          STRING_AGG((bii.product_name || ' x' || bii.quantity::TEXT), ', ' ORDER BY bii.id),
          ''
        ) AS items_summary
      FROM billing_invoices bi
      JOIN billing_customers bc ON bc.id = bi.customer_id
      LEFT JOIN billing_invoice_items bii ON bii.invoice_id = bi.id
      GROUP BY bi.id, bc.full_name, bi.total, bi.payment_status, bi.created_at
      ORDER BY bi.created_at DESC
      LIMIT 300
    `,
  )

  return {
    customers: customersResult.rows.map((row) => ({
      id: Number(row.id),
      fullName: row.full_name,
      lastInvoiceAt: row.last_invoice_at ? new Date(row.last_invoice_at).toISOString() : null,
    })),
    invoices: invoicesResult.rows.map((row) => ({
      id: Number(row.id),
      customerName: row.customer_name,
      total: Number.parseFloat(row.total),
      paymentStatus: normalizePaymentStatus(row.payment_status) as "pending" | "paid",
      createdAt: new Date(row.created_at).toISOString(),
      itemCount: Number(row.item_count ?? 0),
      itemsSummary: row.items_summary || "",
    })),
  }
}

export async function createBillingInvoice(input: CreateBillingInvoiceInput) {
  await requireAdminAccess()

  const customerName = input.customerName?.trim()
  if (!customerName) {
    return { success: false, error: "Customer name is required." }
  }

  const items = (input.items || [])
    .map((item) => ({
      productName: item.productName?.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }))
    .filter((item) => item.productName && item.quantity > 0 && item.unitPrice >= 0)

  if (items.length === 0) {
    return { success: false, error: "At least one valid billing item is required." }
  }

  const notes = input.notes?.trim() || null
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const total = subtotal

  let invoiceId: number | null = null

  try {
    await query("BEGIN")

    const customerResult = await query("SELECT id FROM billing_customers WHERE LOWER(full_name) = LOWER($1) LIMIT 1", [
      customerName,
    ])

    let customerId: number
    if (customerResult.rows.length > 0) {
      customerId = Number(customerResult.rows[0].id)
      await query("UPDATE billing_customers SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [customerId])
    } else {
      const newCustomerResult = await query(
        `
          INSERT INTO billing_customers (full_name, updated_at)
          VALUES ($1, CURRENT_TIMESTAMP)
          RETURNING id
        `,
        [customerName],
      )
      customerId = Number(newCustomerResult.rows[0].id)
    }

    const invoiceResult = await query(
      `
        INSERT INTO billing_invoices (customer_id, subtotal, total, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [customerId, subtotal.toFixed(2), total.toFixed(2), notes],
    )
    invoiceId = Number(invoiceResult.rows[0].id)

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice
      await query(
        `
          INSERT INTO billing_invoice_items (invoice_id, product_name, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [invoiceId, item.productName, item.quantity, item.unitPrice.toFixed(2), lineTotal.toFixed(2)],
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
