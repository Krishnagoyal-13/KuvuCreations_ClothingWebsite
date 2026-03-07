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
  grossTotal: number
  returnTotal: number
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  paidAmount: number
  dueAmount: number
  paymentStatus: "pending" | "paid"
  taxEnabled: boolean
  createdAt: string
  itemCount: number
  itemsSummary: string
}

export interface BillingReturnRecord {
  id: number
  invoiceId: number
  customerId: number
  customerName: string
  returnTotal: number
  isRefunded: boolean
  quantityTotal: number
  itemsSummary: string
  notes: string | null
  createdAt: string
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
  returns: BillingReturnRecord[]
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
  initialPaidAmount?: number
}

export interface UpsertBillingStockByCategoryInput {
  stocks: Array<{
    productType: string
    purchasedQty: number
  }>
}

export interface CreateBillingReturnInput {
  customerId: number
  invoiceId: number
  productName: string
  productType?: string
  quantity: number
  refundAmount: number
  notes?: string
  isRefunded?: boolean
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
      WITH return_totals AS (
        SELECT invoice_id, COALESCE(SUM(return_total), 0) AS return_total
        FROM billing_returns
        GROUP BY invoice_id
      )
      SELECT
        bi.id,
        bc.id AS customer_id,
        bc.full_name AS customer_name,
        COALESCE(bi.customer_phone, bc.phone_number) AS customer_phone,
        bi.total AS gross_total,
        COALESCE(rt.return_total, 0) AS return_total,
        bi.subtotal,
        bi.discount_total,
        bi.tax_total,
        bi.total,
        bi.paid_amount,
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
      LEFT JOIN return_totals rt ON rt.invoice_id = bi.id
      LEFT JOIN billing_invoice_items bii ON bii.invoice_id = bi.id
      GROUP BY
        bi.id,
        bc.id,
        bc.full_name,
        COALESCE(bi.customer_phone, bc.phone_number),
        bi.total,
        COALESCE(rt.return_total, 0),
        bi.subtotal,
        bi.discount_total,
        bi.tax_total,
        bi.paid_amount,
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

  const returnedStockResult = await query(`
    SELECT
      product_type,
      COALESCE(SUM(quantity), 0)::INTEGER AS returned_qty
    FROM billing_return_items
    GROUP BY product_type
  `)

  const returnsResult = await query(
    `
      SELECT
        br.id,
        br.invoice_id,
        br.customer_id,
        bc.full_name AS customer_name,
        br.return_total,
        br.is_refunded,
        br.notes,
        br.created_at,
        COALESCE(SUM(bri.quantity), 0)::INTEGER AS quantity_total,
        COALESCE(
          STRING_AGG((bri.product_name || ' [' || bri.product_type || '] x' || bri.quantity::TEXT), ', ' ORDER BY bri.id),
          ''
        ) AS items_summary
      FROM billing_returns br
      JOIN billing_customers bc ON bc.id = br.customer_id
      LEFT JOIN billing_return_items bri ON bri.return_id = br.id
      GROUP BY br.id, br.invoice_id, br.customer_id, bc.full_name, br.return_total, br.is_refunded, br.notes, br.created_at
      ORDER BY br.created_at DESC
      LIMIT 300
    `,
  )

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

  const returnedByType = new Map<string, number>()
  for (const row of returnedStockResult.rows) {
    const key = String(row.product_type).toLowerCase()
    returnedByType.set(key, Number(row.returned_qty ?? 0))
  }

  const stockByCategory = BILLING_PRODUCT_TYPES.map((productType) => {
    const key = productType.toLowerCase()
    const purchasedQty = Math.max(0, purchasedByType.get(key) ?? 0)
    const soldQtyRaw = Math.max(0, soldByType.get(key) ?? 0)
    const returnedQty = Math.max(0, returnedByType.get(key) ?? 0)
    const soldQty = Math.max(0, soldQtyRaw - returnedQty)

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
    invoices: invoicesResult.rows.map((row) => {
      const grossTotal = toMoney(Number.parseFloat(row.gross_total ?? row.total ?? "0"))
      const returnTotal = toMoney(Math.max(0, Number.parseFloat(row.return_total ?? "0")))
      const netTotal = toMoney(Math.max(0, grossTotal - returnTotal))
      const paidAmountRaw = toMoney(Math.max(0, Number.parseFloat(row.paid_amount ?? "0")))
      const paidAmount = toMoney(Math.min(paidAmountRaw, netTotal))
      const dueAmount = toMoney(Math.max(0, netTotal - paidAmount))
      const paymentStatus = dueAmount <= 0 ? "paid" : normalizePaymentStatus(row.payment_status)

      return {
        id: Number(row.id),
        customerId: Number(row.customer_id),
        customerName: row.customer_name,
        customerPhone: row.customer_phone ?? null,
        grossTotal,
        returnTotal,
        subtotal: Number.parseFloat(row.subtotal),
        discountTotal: Number.parseFloat(row.discount_total),
        taxTotal: Number.parseFloat(row.tax_total),
        total: netTotal,
        paidAmount,
        dueAmount,
        paymentStatus: paymentStatus as "pending" | "paid",
        taxEnabled: row.tax_enabled === true,
        createdAt: new Date(row.created_at).toISOString(),
        itemCount: Number(row.item_count ?? 0),
        itemsSummary: row.items_summary || "",
      }
    }),
    returns: returnsResult.rows.map((row) => ({
      id: Number(row.id),
      invoiceId: Number(row.invoice_id),
      customerId: Number(row.customer_id),
      customerName: row.customer_name,
      returnTotal: Number.parseFloat(row.return_total ?? "0"),
      isRefunded: row.is_refunded === true,
      quantityTotal: Number(row.quantity_total ?? 0),
      itemsSummary: row.items_summary || "",
      notes: row.notes ?? null,
      createdAt: new Date(row.created_at).toISOString(),
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
  const requestedInitialPaidAmount = toMoney(Number(input.initialPaidAmount ?? 0))
  if (!Number.isFinite(requestedInitialPaidAmount) || requestedInitialPaidAmount < 0) {
    return { success: false, error: "Initial paid amount must be 0 or higher." }
  }
  const initialPaidAmount = toMoney(Math.min(total, Math.max(0, requestedInitialPaidAmount)))
  const paymentStatus = initialPaidAmount >= total ? "paid" : "pending"

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
          paid_amount,
          payment_status,
          tax_enabled,
          customer_phone,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        customerId,
        subtotal.toFixed(2),
        discountTotal.toFixed(2),
        taxTotal.toFixed(2),
        total.toFixed(2),
        initialPaidAmount.toFixed(2),
        paymentStatus,
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

export async function recordBillingPayment(invoiceId: number, amount: number) {
  await requireAdminAccess()

  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return { success: false, error: "Invalid invoice id." }
  }

  const paymentAmount = toMoney(Number(amount))
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return { success: false, error: "Payment amount must be greater than 0." }
  }

  try {
    await query("BEGIN")

    const invoiceResult = await query("SELECT id, total, paid_amount FROM billing_invoices WHERE id = $1 LIMIT 1", [invoiceId])
    if (invoiceResult.rows.length === 0) {
      await query("ROLLBACK")
      return { success: false, error: "Invoice not found." }
    }

    const invoiceRow = invoiceResult.rows[0]
    const returnResult = await query(
      "SELECT COALESCE(SUM(return_total), 0) AS return_total FROM billing_returns WHERE invoice_id = $1",
      [invoiceId],
    )

    const grossTotal = toMoney(Number.parseFloat(invoiceRow.total ?? "0"))
    const returnTotal = toMoney(Math.max(0, Number.parseFloat(returnResult.rows[0]?.return_total ?? "0")))
    const netTotal = toMoney(Math.max(0, grossTotal - returnTotal))
    const currentPaid = toMoney(Math.min(Math.max(0, Number.parseFloat(invoiceRow.paid_amount ?? "0")), netTotal))
    const nextPaid = toMoney(Math.min(netTotal, currentPaid + paymentAmount))
    const dueAmount = toMoney(Math.max(0, netTotal - nextPaid))
    const paymentStatus = dueAmount <= 0 ? "paid" : "pending"

    await query(
      "UPDATE billing_invoices SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [nextPaid.toFixed(2), paymentStatus, invoiceId],
    )

    await query("COMMIT")
    revalidatePath("/admin")
    return { success: true, paidAmount: nextPaid, dueAmount }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while recording payment:", rollbackError)
    }
    console.error("Record payment error:", error)
    return { success: false, error: "Could not record payment amount." }
  }
}

export async function createBillingReturn(input: CreateBillingReturnInput) {
  await requireAdminAccess()

  const customerId = Number(input.customerId)
  const invoiceId = Number(input.invoiceId)
  const productName = input.productName?.trim()
  const productType = normalizeProductType(input.productType)
  const quantity = Math.floor(Number(input.quantity))
  const refundAmount = toMoney(Number(input.refundAmount))
  const notes = input.notes?.trim() || null
  const isRefunded = input.isRefunded === true

  if (!Number.isFinite(customerId) || customerId <= 0) {
    return { success: false, error: "Invalid customer." }
  }
  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return { success: false, error: "Invalid invoice." }
  }
  if (!productName) {
    return { success: false, error: "Product name is required for return." }
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { success: false, error: "Return quantity must be at least 1." }
  }
  if (!Number.isFinite(refundAmount) || refundAmount < 0) {
    return { success: false, error: "Refund amount must be 0 or higher." }
  }

  try {
    await query("BEGIN")

    const invoiceResult = await query(
      "SELECT id, customer_id, total, paid_amount FROM billing_invoices WHERE id = $1 LIMIT 1",
      [invoiceId],
    )
    if (invoiceResult.rows.length === 0) {
      await query("ROLLBACK")
      return { success: false, error: "Invoice not found." }
    }

    const invoiceRow = invoiceResult.rows[0]
    if (Number(invoiceRow.customer_id) !== customerId) {
      await query("ROLLBACK")
      return { success: false, error: "Selected invoice does not belong to selected customer." }
    }

    const previousReturnsResult = await query(
      "SELECT COALESCE(SUM(return_total), 0) AS return_total FROM billing_returns WHERE invoice_id = $1",
      [invoiceId],
    )
    const grossTotal = toMoney(Number.parseFloat(invoiceRow.total ?? "0"))
    const previousReturns = toMoney(Math.max(0, Number.parseFloat(previousReturnsResult.rows[0]?.return_total ?? "0")))
    const remainingReturnableAmount = toMoney(Math.max(0, grossTotal - previousReturns))

    if (refundAmount > remainingReturnableAmount) {
      await query("ROLLBACK")
      return { success: false, error: "Refund amount cannot exceed remaining invoice value after previous returns." }
    }

    const returnResult = await query(
      `
        INSERT INTO billing_returns (invoice_id, customer_id, return_total, is_refunded, notes, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [invoiceId, customerId, refundAmount.toFixed(2), isRefunded, notes],
    )

    const returnId = Number(returnResult.rows[0].id)
    const unitRefund = quantity > 0 ? toMoney(refundAmount / quantity) : 0

    await query(
      `
        INSERT INTO billing_return_items (
          return_id,
          product_name,
          product_type,
          quantity,
          unit_refund,
          line_refund
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [returnId, productName, productType, quantity, unitRefund.toFixed(2), refundAmount.toFixed(2)],
    )

    const updatedReturnsResult = await query(
      "SELECT COALESCE(SUM(return_total), 0) AS return_total FROM billing_returns WHERE invoice_id = $1",
      [invoiceId],
    )
    const updatedReturnTotal = toMoney(Math.max(0, Number.parseFloat(updatedReturnsResult.rows[0]?.return_total ?? "0")))
    const netTotal = toMoney(Math.max(0, grossTotal - updatedReturnTotal))
    const currentPaid = toMoney(Math.max(0, Number.parseFloat(invoiceRow.paid_amount ?? "0")))
    const adjustedPaid = toMoney(Math.min(currentPaid, netTotal))
    const paymentStatus = adjustedPaid >= netTotal ? "paid" : "pending"

    await query(
      "UPDATE billing_invoices SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [adjustedPaid.toFixed(2), paymentStatus, invoiceId],
    )

    await query("COMMIT")
    revalidatePath("/admin")
    return { success: true, returnId }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while creating return:", rollbackError)
    }
    console.error("Create return error:", error)
    return { success: false, error: "Could not save return." }
  }
}

export async function updateBillingReturnRefundStatus(returnId: number, isRefunded: boolean) {
  await requireAdminAccess()

  if (!Number.isFinite(returnId) || returnId <= 0) {
    return { success: false, error: "Invalid return id." }
  }

  try {
    const result = await query(
      "UPDATE billing_returns SET is_refunded = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [isRefunded, returnId],
    )

    if ((result.rowCount ?? 0) === 0) {
      return { success: false, error: "Return entry not found." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Update return refund status error:", error)
    return { success: false, error: "Could not update refund status." }
  }
}

export async function updateBillingPaymentStatus(invoiceId: number, status: "pending" | "paid") {
  await requireAdminAccess()

  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return { success: false, error: "Invalid invoice id." }
  }

  const paymentStatus = normalizePaymentStatus(status)

  try {
    await query("BEGIN")

    const invoiceResult = await query("SELECT id, total FROM billing_invoices WHERE id = $1 LIMIT 1", [invoiceId])
    if (invoiceResult.rows.length === 0) {
      await query("ROLLBACK")
      return { success: false, error: "Invoice not found." }
    }

    const returnResult = await query(
      "SELECT COALESCE(SUM(return_total), 0) AS return_total FROM billing_returns WHERE invoice_id = $1",
      [invoiceId],
    )
    const grossTotal = toMoney(Number.parseFloat(invoiceResult.rows[0].total ?? "0"))
    const returnTotal = toMoney(Math.max(0, Number.parseFloat(returnResult.rows[0]?.return_total ?? "0")))
    const netTotal = toMoney(Math.max(0, grossTotal - returnTotal))
    const paidAmount = paymentStatus === "paid" ? netTotal : 0

    await query(
      "UPDATE billing_invoices SET payment_status = $1, paid_amount = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [paymentStatus, paidAmount.toFixed(2), invoiceId],
    )

    await query("COMMIT")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    try {
      await query("ROLLBACK")
    } catch (rollbackError) {
      console.error("Rollback error while updating payment status:", rollbackError)
    }
    console.error("Update payment status error:", error)
    return { success: false, error: "Could not update payment status." }
  }
}
