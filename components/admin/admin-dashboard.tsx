"use client"

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Calculator, CheckCircle2, Download, Plus, ReceiptText, ShieldCheck, Trash2 } from "lucide-react"

import { useUser } from "@/context/user-context"
import {
  createBillingInvoice,
  logoutAdmin,
  updateBillingPaymentStatus,
  upsertBillingStockByCategory,
  upsertCustomerOpeningBalance,
  type BillingCustomerOption,
  type BillingInvoiceRecord,
  type BillingStockCategoryRecord,
} from "@/lib/admin-actions"
import { BILLING_PRODUCT_TYPES } from "@/lib/billing-constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface BillingRowInput {
  productName: string
  productType: string
  quantity: number
  unitPrice: number
  discountPercent: number
  taxPercent: number
}

interface AdminDashboardProps {
  customers: BillingCustomerOption[]
  invoices: BillingInvoiceRecord[]
  stockByCategory: BillingStockCategoryRecord[]
}

const calculatorKeys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "+", "C", "<-", "="]
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString()
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function parseNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function evaluateExpression(expression: string) {
  const trimmed = expression.trim()
  if (!trimmed) {
    return null
  }

  if (!/^[0-9+\-*/().\s]+$/.test(trimmed)) {
    return null
  }

  try {
    const result = Function(`"use strict"; return (${trimmed})`)() as number
    if (!Number.isFinite(result)) {
      return null
    }
    return roundMoney(result)
  } catch {
    return null
  }
}

function getRowTotals(row: BillingRowInput, taxEnabled: boolean) {
  const quantity = Math.max(0, row.quantity || 0)
  const unitPrice = Math.max(0, row.unitPrice || 0)
  const baseTotal = roundMoney(quantity * unitPrice)
  const discountPercent = clamp(row.discountPercent || 0, 0, 100)
  const discountValue = roundMoney((baseTotal * discountPercent) / 100)
  const discountedAmount = roundMoney(baseTotal - discountValue)
  const taxPercent = taxEnabled ? Math.max(0, row.taxPercent || 0) : 0
  const taxAmount = roundMoney((discountedAmount * taxPercent) / 100)
  const lineTotal = roundMoney(discountedAmount + taxAmount)

  return {
    baseTotal,
    discountPercent,
    discountValue,
    taxPercent,
    taxAmount,
    lineTotal,
  }
}

export default function AdminDashboard({ customers, invoices, stockByCategory }: AdminDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<BillingRowInput[]>([
    { productName: "", productType: BILLING_PRODUCT_TYPES[0], quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
  ])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [paymentCustomerFilter, setPaymentCustomerFilter] = useState("all")
  const [accountCustomerFilter, setAccountCustomerFilter] = useState("")
  const [balanceCustomerId, setBalanceCustomerId] = useState("")
  const [balanceCustomerName, setBalanceCustomerName] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")
  const [stockByCategoryInput, setStockByCategoryInput] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      BILLING_PRODUCT_TYPES.map((productType) => {
        const existing = stockByCategory.find((stock) => stock.productType === productType)
        return [productType, String(existing?.purchasedQty ?? 0)]
      }),
    ),
  )
  const [calculatorExpression, setCalculatorExpression] = useState("")
  const [calculatorHistory, setCalculatorHistory] = useState<Array<{ expression: string; result: number }>>([])
  const [formError, setFormError] = useState("")
  const [balanceError, setBalanceError] = useState("")
  const [stockError, setStockError] = useState("")
  const [isPrintingPdf, setIsPrintingPdf] = useState(false)
  const [isSubmitting, startSubmitting] = useTransition()
  const [isUpdatingStatus, startUpdatingStatus] = useTransition()
  const [isSavingBalance, startSavingBalance] = useTransition()
  const [isSavingStock, startSavingStock] = useTransition()
  const [isLoggingOut, startLoggingOut] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshAdminStatus } = useUser()

  useEffect(() => {
    setStockByCategoryInput(
      Object.fromEntries(
        BILLING_PRODUCT_TYPES.map((productType) => {
          const existing = stockByCategory.find((stock) => stock.productType === productType)
          return [productType, String(existing?.purchasedQty ?? 0)]
        }),
      ),
    )
  }, [stockByCategory])

  const calculatedRows = useMemo(() => items.map((row) => getRowTotals(row, taxEnabled)), [items, taxEnabled])

  const billSummary = useMemo(
    () => ({
      subtotal: roundMoney(calculatedRows.reduce((sum, row) => sum + row.baseTotal, 0)),
      discountTotal: roundMoney(calculatedRows.reduce((sum, row) => sum + row.discountValue, 0)),
      taxTotal: roundMoney(calculatedRows.reduce((sum, row) => sum + row.taxAmount, 0)),
      total: roundMoney(calculatedRows.reduce((sum, row) => sum + row.lineTotal, 0)),
    }),
    [calculatedRows],
  )

  const calculatorResult = useMemo(() => evaluateExpression(calculatorExpression), [calculatorExpression])

  const filteredPaymentInvoices = useMemo(() => {
    if (paymentCustomerFilter === "all") {
      return invoices
    }
    const customerId = Number(paymentCustomerFilter)
    return invoices.filter((invoice) => invoice.customerId === customerId)
  }, [invoices, paymentCustomerFilter])

  const paymentSummary = useMemo(
    () => ({
      paidTotal: roundMoney(
        filteredPaymentInvoices
          .filter((invoice) => invoice.paymentStatus === "paid")
          .reduce((sum, invoice) => sum + invoice.total, 0),
      ),
      pendingTotal: roundMoney(
        filteredPaymentInvoices
          .filter((invoice) => invoice.paymentStatus === "pending")
          .reduce((sum, invoice) => sum + invoice.total, 0),
      ),
    }),
    [filteredPaymentInvoices],
  )

  const accountInvoices = useMemo(() => {
    if (!accountCustomerFilter) {
      return []
    }
    const customerId = Number(accountCustomerFilter)
    return invoices.filter((invoice) => invoice.customerId === customerId)
  }, [invoices, accountCustomerFilter])

  const selectedAccountCustomer = useMemo(() => {
    if (!accountCustomerFilter) {
      return null
    }
    return customers.find((customer) => String(customer.id) === accountCustomerFilter) ?? null
  }, [customers, accountCustomerFilter])

  const accountSummary = useMemo(() => {
    const openingBalance = selectedAccountCustomer?.openingBalance ?? 0
    const billedTotal = roundMoney(accountInvoices.reduce((sum, invoice) => sum + invoice.total, 0))
    const paidTotal = roundMoney(
      accountInvoices.filter((invoice) => invoice.paymentStatus === "paid").reduce((sum, invoice) => sum + invoice.total, 0),
    )
    const invoicePendingTotal = roundMoney(
      accountInvoices
        .filter((invoice) => invoice.paymentStatus === "pending")
        .reduce((sum, invoice) => sum + invoice.total, 0),
    )

    return {
      openingBalance: roundMoney(openingBalance),
      billedTotal,
      paidTotal,
      invoicePendingTotal,
      pendingTotal: roundMoney(openingBalance + invoicePendingTotal),
      lifecycleTotal: roundMoney(openingBalance + billedTotal),
    }
  }, [accountInvoices, selectedAccountCustomer])

  const customersWithOpeningBalance = useMemo(
    () => customers.filter((customer) => customer.openingBalance > 0).sort((a, b) => b.openingBalance - a.openingBalance),
    [customers],
  )

  const handleSelectCustomer = (value: string) => {
    setSelectedCustomer(value)
    const chosenCustomer = customers.find((customer) => String(customer.id) === value)
    if (chosenCustomer) {
      setCustomerName(chosenCustomer.fullName)
      setCustomerPhone(chosenCustomer.phoneNumber ?? "")
    } else {
      setCustomerPhone("")
    }
  }

  const handleSelectBalanceCustomer = (value: string) => {
    setBalanceCustomerId(value)

    const chosenCustomer = customers.find((customer) => String(customer.id) === value)
    if (!chosenCustomer) {
      setBalanceCustomerName("")
      setBalanceAmount("")
      return
    }

    setBalanceCustomerName(chosenCustomer.fullName)
    setBalanceAmount(String(chosenCustomer.openingBalance ?? 0))
  }

  const updateItem = (index: number, key: keyof BillingRowInput, value: string) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        if (key === "quantity") {
          return { ...item, quantity: parseNumber(value) }
        }
        if (key === "unitPrice") {
          return { ...item, unitPrice: parseNumber(value) }
        }
        if (key === "discountPercent") {
          return { ...item, discountPercent: parseNumber(value) }
        }
        if (key === "taxPercent") {
          return { ...item, taxPercent: parseNumber(value) }
        }
        if (key === "productType") {
          return { ...item, productType: value }
        }
        return { ...item, productName: value }
      }),
    )
  }

  const addItemRow = () => {
    setItems((currentItems) => [
      ...currentItems,
      { productName: "", productType: BILLING_PRODUCT_TYPES[0], quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 },
    ])
  }

  const removeItemRow = (index: number) => {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems
      }
      return currentItems.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const resetBillForm = () => {
    setSelectedCustomer("")
    setCustomerName("")
    setCustomerPhone("")
    setNotes("")
    setTaxEnabled(false)
    setItems([{ productName: "", productType: BILLING_PRODUCT_TYPES[0], quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }])
  }

  const submitBill = (withPdf: boolean) => {
    setFormError("")

    startSubmitting(async () => {
      const result = await createBillingInvoice({
        customerName,
        customerPhone,
        notes,
        items,
        taxEnabled,
      })

      if (!result.success) {
        const errorMessage = result.error || "Could not create bill."
        setFormError(errorMessage)
        toast({
          title: "Billing failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      if (withPdf) {
        handleGeneratePdf(result.invoiceId)
      }

      toast({
        title: "Bill created",
        description: `Invoice #${result.invoiceId} saved successfully.`,
      })

      resetBillForm()
      router.refresh()
    })
  }

  const handleCreateBill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitBill(false)
  }

  const handleCreateBillAndPdf = () => {
    submitBill(true)
  }

  const togglePaymentStatus = (invoice: BillingInvoiceRecord) => {
    startUpdatingStatus(async () => {
      const nextStatus = invoice.paymentStatus === "paid" ? "pending" : "paid"
      const result = await updateBillingPaymentStatus(invoice.id, nextStatus)

      if (!result.success) {
        toast({
          title: "Status update failed",
          description: result.error || "Could not update payment status.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Payment status updated",
        description: `Invoice #${invoice.id} marked as ${nextStatus}.`,
      })
      router.refresh()
    })
  }

  const handleSaveOpeningBalance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBalanceError("")

    startSavingBalance(async () => {
      const openingBalance = parseNumber(balanceAmount)
      const result = await upsertCustomerOpeningBalance({
        customerId: balanceCustomerId ? Number(balanceCustomerId) : null,
        customerName: balanceCustomerName,
        openingBalance,
      })

      if (!result.success) {
        const errorMessage = result.error || "Could not save opening balance."
        setBalanceError(errorMessage)
        toast({
          title: "Save failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Opening balance saved",
        description: "Customer balance has been updated.",
      })
      router.refresh()
    })
  }

  const handleSaveStockByCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStockError("")

    startSavingStock(async () => {
      const payload = BILLING_PRODUCT_TYPES.map((productType) => ({
        productType,
        purchasedQty: Math.max(0, Math.floor(parseNumber(stockByCategoryInput[productType] ?? "0"))),
      }))

      const result = await upsertBillingStockByCategory({ stocks: payload })

      if (!result.success) {
        const errorMessage = result.error || "Could not save category stock."
        setStockError(errorMessage)
        toast({
          title: "Stock save failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Stock updated",
        description: "Category stock purchased quantities were saved.",
      })
      router.refresh()
    })
  }

  const handleCalculatorInputChange = (value: string) => {
    setCalculatorExpression(value.replace(/[^0-9+\-*/().\s]/g, ""))
  }

  const handleCalculatorKey = (key: string) => {
    if (key === "C") {
      setCalculatorExpression("")
      return
    }

    if (key === "<-") {
      setCalculatorExpression((current) => current.slice(0, -1))
      return
    }

    if (key === "=") {
      const result = evaluateExpression(calculatorExpression)
      if (result === null) {
        toast({
          title: "Invalid calculation",
          description: "Use only numbers and + - * / ( ) operators.",
          variant: "destructive",
        })
        return
      }

      setCalculatorHistory((current) => [{ expression: calculatorExpression, result }, ...current].slice(0, 5))
      setCalculatorExpression(String(result))
      return
    }

    setCalculatorExpression((current) => `${current}${key}`)
  }

  const applyCalculatorResultToLastPrice = () => {
    if (calculatorResult === null) {
      toast({
        title: "No result available",
        description: "Run the calculation first.",
        variant: "destructive",
      })
      return
    }

    setItems((currentItems) => {
      if (currentItems.length === 0) {
        return currentItems
      }

      const lastIndex = currentItems.length - 1
      return currentItems.map((item, index) =>
        index === lastIndex
          ? {
              ...item,
              unitPrice: calculatorResult,
            }
          : item,
      )
    })

    toast({
      title: "Applied",
      description: "Calculator result added to last item unit price.",
    })
  }

  const addCalculatorResultToNotes = () => {
    if (calculatorResult === null) {
      toast({
        title: "No result available",
        description: "Run the calculation first.",
        variant: "destructive",
      })
      return
    }

    setNotes((current) => {
      const line = `Calc: ${calculatorExpression} = ${calculatorResult}`
      return current ? `${current}\n${line}` : line
    })
  }

  const handleGenerateAccountPdf = () => {
    if (!selectedAccountCustomer) {
      toast({
        title: "Select customer first",
        description: "Choose a customer in Account tab before generating PDF.",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open("", "_blank", "width=1100,height=760")
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site to generate the PDF.",
        variant: "destructive",
      })
      return
    }

    const paidInvoices = accountInvoices.filter((invoice) => invoice.paymentStatus === "paid")
    const pendingInvoices = accountInvoices.filter((invoice) => invoice.paymentStatus === "pending")

    const renderRows = (rows: BillingInvoiceRecord[]) => {
      if (rows.length === 0) {
        return `<tr><td colspan=\"5\" style=\"text-align:center;color:#6b7280\">No invoices</td></tr>`
      }

      return rows
        .map(
          (invoice) => `
            <tr>
              <td>#${invoice.id}</td>
              <td>${escapeHtml(formatDate(invoice.createdAt))}</td>
              <td>${escapeHtml(invoice.itemsSummary || `${invoice.itemCount} items`)}</td>
              <td>${formatCurrency(invoice.total)}</td>
              <td>${invoice.paymentStatus === "paid" ? "Paid" : "Pending"}</td>
            </tr>
          `,
        )
        .join("")
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Account Statement - ${escapeHtml(selectedAccountCustomer.fullName)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #10172b; margin: 0; padding: 28px; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111827; padding-bottom: 12px; }
            .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.08em; }
            .sub { margin-top: 4px; color: #4b5563; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
            .meta { margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 13px; }
            .kpis { margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
            .kpi { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px; background: #f8fafc; }
            .kpi-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
            .kpi-value { margin-top: 6px; font-size: 18px; font-weight: 700; }
            h2 { margin: 20px 0 8px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .foot { margin-top: 18px; color: #6b7280; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">KUVU CREATIONS</div>
              <div class="sub">Customer Account Statement</div>
            </div>
            <div>${escapeHtml(new Date().toLocaleString())}</div>
          </div>

          <div class="meta">
            <div><strong>Customer:</strong> ${escapeHtml(selectedAccountCustomer.fullName)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(selectedAccountCustomer.phoneNumber || "N/A")}</div>
          </div>

          <div class="kpis">
            <div class="kpi"><div class="kpi-title">Opening Balance</div><div class="kpi-value">${formatCurrency(accountSummary.openingBalance)}</div></div>
            <div class="kpi"><div class="kpi-title">Invoice Total</div><div class="kpi-value">${formatCurrency(accountSummary.billedTotal)}</div></div>
            <div class="kpi"><div class="kpi-title">Paid</div><div class="kpi-value">${formatCurrency(accountSummary.paidTotal)}</div></div>
            <div class="kpi"><div class="kpi-title">Pending</div><div class="kpi-value">${formatCurrency(accountSummary.pendingTotal)}</div></div>
          </div>

          <h2>Pending Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${renderRows(pendingInvoices)}
            </tbody>
          </table>

          <h2>Paid Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${renderRows(paidInvoices)}
            </tbody>
          </table>

          <div class="foot">Generated by KUVU CREATIONS Admin Panel</div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleGeneratePdf = (invoiceId?: number) => {
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter or select customer name before generating PDF.",
        variant: "destructive",
      })
      return
    }

    const printableItems = items
      .map((item, index) => ({
        ...item,
        totals: calculatedRows[index],
      }))
      .filter((item) => item.productName.trim().length > 0)

    if (printableItems.length === 0) {
      toast({
        title: "No items to print",
        description: "Add at least one product row before generating PDF.",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open("", "_blank", "width=1024,height=720")
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site to generate the PDF.",
        variant: "destructive",
      })
      return
    }

    setIsPrintingPdf(true)

    const rowsHtml = printableItems
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td>${escapeHtml(item.productType)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${item.totals.discountPercent.toFixed(2)}%</td>
            <td>${taxEnabled ? `${item.totals.taxPercent.toFixed(2)}%` : "-"}</td>
            <td>${formatCurrency(item.totals.lineTotal)}</td>
          </tr>
        `,
      )
      .join("")

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KUVU CREATIONS Bill</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 28px; color: #10172b; }
            .header { border-bottom: 2px solid #10172b; padding-bottom: 14px; margin-bottom: 20px; }
            .brand { font-size: 28px; font-weight: 800; letter-spacing: 0.1em; }
            .subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; color: #4d5570; }
            .meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
            .meta-box { font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d9dce6; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f5fb; }
            .summary { margin-top: 18px; margin-left: auto; max-width: 320px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .summary-total { border-top: 1px solid #c2c8d9; margin-top: 8px; padding-top: 8px; font-weight: 800; font-size: 16px; }
            .notes { margin-top: 20px; padding: 10px; border: 1px dashed #c2c8d9; background: #fafbff; font-size: 12px; }
            .foot { margin-top: 24px; font-size: 11px; color: #5b6076; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">KUVU CREATIONS</div>
            <div class="subtitle">Tax Invoice</div>
          </div>

          <div class="meta">
            <div class="meta-box"><strong>Invoice:</strong> ${invoiceId ? `#${invoiceId}` : "Draft"}</div>
            <div class="meta-box"><strong>Customer:</strong> ${escapeHtml(customerName.trim())}</div>
            <div class="meta-box"><strong>Phone:</strong> ${escapeHtml(customerPhone.trim() || "N/A")}</div>
            <div class="meta-box"><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount %</th>
                <th>Tax %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>Sub Total</span><span>${formatCurrency(billSummary.subtotal)}</span></div>
            <div class="summary-row"><span>Discount</span><span>- ${formatCurrency(billSummary.discountTotal)}</span></div>
            ${taxEnabled ? `<div class="summary-row"><span>Tax</span><span>${formatCurrency(billSummary.taxTotal)}</span></div>` : ""}
            <div class="summary-row summary-total"><span>Total</span><span>${formatCurrency(billSummary.total)}</span></div>
          </div>

          ${notes.trim() ? `<div class="notes"><strong>Notes:</strong><br/>${escapeHtml(notes).replaceAll("\n", "<br/>")}</div>` : ""}

          <div class="foot">Generated by KUVU CREATIONS Billing Panel</div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    const stopLoading = () => setIsPrintingPdf(false)
    printWindow.onafterprint = stopLoading

    setTimeout(() => {
      try {
        printWindow.print()
      } finally {
        setTimeout(stopLoading, 1000)
      }
    }, 350)
  }

  const handleAdminLogout = () => {
    startLoggingOut(async () => {
      await logoutAdmin()
      await refreshAdminStatus()
      router.refresh()
    })
  }

  return (
    <div className="container space-y-6 py-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[#171f32] sm:text-3xl">
            <ShieldCheck className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#5f667b]">
            Mobile-first billing, payment tracking, account summary, and opening balance onboarding.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleAdminLogout}
          disabled={isLoggingOut}
          className="rounded-full border-[#1f2536]/25 bg-white/70"
        >
          {isLoggingOut ? "Exiting..." : "Exit Admin Mode"}
        </Button>
      </div>

      <Tabs defaultValue="billing" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max gap-1 rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/80 p-1">
            <TabsTrigger value="billing" className="min-w-[110px] rounded-lg px-3 py-2 text-xs sm:text-sm">
              Billing
            </TabsTrigger>
            <TabsTrigger value="orders" className="min-w-[110px] rounded-lg px-3 py-2 text-xs sm:text-sm">
              Orders
            </TabsTrigger>
            <TabsTrigger value="payments" className="min-w-[130px] rounded-lg px-3 py-2 text-xs sm:text-sm">
              Payment Status
            </TabsTrigger>
            <TabsTrigger value="account" className="min-w-[110px] rounded-lg px-3 py-2 text-xs sm:text-sm">
              Account
            </TabsTrigger>
            <TabsTrigger value="balances" className="min-w-[146px] rounded-lg px-3 py-2 text-xs sm:text-sm">
              Opening Balance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="billing">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Create Customer Bill</CardTitle>
              <CardDescription>
                Discount is percentage based. Save bills to database and optionally generate a professional PDF instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBill} className="space-y-5">
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/65 p-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#1f2536]/10 bg-white/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Step 1</p>
                    <p className="mt-1 text-sm font-medium text-[#171f32]">Select customer or add a new name.</p>
                  </div>
                  <div className="rounded-lg border border-[#1f2536]/10 bg-white/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Step 2</p>
                    <p className="mt-1 text-sm font-medium text-[#171f32]">Fill products, quantity, unit price and discount %.</p>
                  </div>
                  <div className="rounded-lg border border-[#1f2536]/10 bg-white/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Step 3</p>
                    <p className="mt-1 text-sm font-medium text-[#171f32]">Use calculator for long bills and verify totals.</p>
                  </div>
                  <div className="rounded-lg border border-[#1f2536]/10 bg-white/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Step 4</p>
                    <p className="mt-1 text-sm font-medium text-[#171f32]">Create bill and optionally export as PDF.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="existing-customer" className="text-sm font-medium text-[#171f32]">
                      Previous Customers
                    </label>
                    <select
                      id="existing-customer"
                      value={selectedCustomer}
                      onChange={(event) => handleSelectCustomer(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                    >
                      <option value="">Select previous customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>
                          {customer.fullName}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[#5f667b]">Selecting a customer fills the name automatically.</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customer-name" className="text-sm font-medium text-[#171f32]">
                      Customer Name
                    </label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Enter customer name"
                      className="border-[#1f2536]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="billing-customer-phone" className="text-sm font-medium text-[#171f32]">
                      Phone Number (optional)
                    </label>
                    <Input
                      id="billing-customer-phone"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Enter phone number"
                      className="border-[#1f2536]/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Product Pricing</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 rounded-md border border-[#1f2536]/15 bg-[#f8f3e8]/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Checkbox id="tax-enabled" checked={taxEnabled} onCheckedChange={(checked) => setTaxEnabled(checked === true)} />
                      <label htmlFor="tax-enabled" className="cursor-pointer text-sm font-medium text-[#171f32]">
                        Apply Tax
                      </label>
                      <span className="text-xs text-[#5f667b]">Enable tax only when GST/Tax should be applied.</span>
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {items.map((item, index) => {
                      const rowTotals = calculatedRows[index]
                      return (
                        <div key={`mobile-row-${index}`} className="rounded-xl border border-[#1f2536]/10 bg-white/75 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#171f32]">Item {index + 1}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItemRow(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#5f667b]">Product Name</label>
                              <Input
                                value={item.productName}
                                onChange={(event) => updateItem(index, "productName", event.target.value)}
                                placeholder="Product name"
                                className="border-[#1f2536]/20"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-medium text-[#5f667b]">Product Type</label>
                              <select
                                value={item.productType}
                                onChange={(event) => updateItem(index, "productType", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                              >
                                {BILLING_PRODUCT_TYPES.map((productType) => (
                                  <option key={`${productType}-mobile-${index}`} value={productType}>
                                    {productType}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-[#5f667b]">Quantity</label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                                  className="border-[#1f2536]/20"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-[#5f667b]">Unit Price</label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                                  className="border-[#1f2536]/20"
                                  required
                                />
                              </div>
                            </div>

                            <div className={`grid gap-3 ${taxEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-[#5f667b]">Discount %</label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={item.discountPercent}
                                  onChange={(event) => updateItem(index, "discountPercent", event.target.value)}
                                  className="border-[#1f2536]/20"
                                />
                              </div>
                              {taxEnabled && (
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-[#5f667b]">Tax %</label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.taxPercent}
                                    onChange={(event) => updateItem(index, "taxPercent", event.target.value)}
                                    className="border-[#1f2536]/20"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="rounded-md border border-[#1f2536]/10 bg-[#f8f3e8]/70 px-3 py-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[#5f667b]">Discount Amount</span>
                                <span className="font-medium text-[#171f32]">{formatCurrency(rowTotals?.discountValue || 0)}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[#5f667b]">Amount</span>
                                <span className="font-semibold text-[#171f32]">{formatCurrency(rowTotals?.lineTotal || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hidden overflow-x-auto rounded-xl border border-[#1f2536]/10 md:block">
                    <table className="w-full min-w-[1160px] text-sm">
                      <thead className="bg-[#f8f3e8]/70 text-[#5f667b]">
                        <tr className="border-b border-[#1f2536]/10">
                          <th className="px-2 py-2 text-left">Product</th>
                          <th className="px-2 py-2 text-left">Type</th>
                          <th className="px-2 py-2 text-left">Quantity</th>
                          <th className="px-2 py-2 text-left">Unit Price</th>
                          <th className="px-2 py-2 text-left">Discount %</th>
                          {taxEnabled && <th className="px-2 py-2 text-left">Tax %</th>}
                          <th className="px-2 py-2 text-right">Discount Amt</th>
                          <th className="px-2 py-2 text-right">Amount</th>
                          <th className="px-2 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const rowTotals = calculatedRows[index]
                          return (
                            <tr key={index} className="border-b border-[#1f2536]/10">
                              <td className="px-2 py-2">
                                <Input
                                  value={item.productName}
                                  onChange={(event) => updateItem(index, "productName", event.target.value)}
                                  placeholder="Product name"
                                  className="border-[#1f2536]/20"
                                  required
                                />
                              </td>
                              <td className="px-2 py-2">
                                <select
                                  value={item.productType}
                                  onChange={(event) => updateItem(index, "productType", event.target.value)}
                                  className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                                >
                                  {BILLING_PRODUCT_TYPES.map((productType) => (
                                    <option key={`${productType}-desktop-${index}`} value={productType}>
                                      {productType}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                                  className="border-[#1f2536]/20"
                                  required
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                                  className="border-[#1f2536]/20"
                                  required
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  value={item.discountPercent}
                                  onChange={(event) => updateItem(index, "discountPercent", event.target.value)}
                                  className="border-[#1f2536]/20"
                                />
                              </td>
                              {taxEnabled && (
                                <td className="px-2 py-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.taxPercent}
                                    onChange={(event) => updateItem(index, "taxPercent", event.target.value)}
                                    className="border-[#1f2536]/20"
                                  />
                                </td>
                              )}
                              <td className="px-2 py-2 text-right font-medium text-[#171f32]">
                                {formatCurrency(rowTotals?.discountValue || 0)}
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-[#171f32]">
                                {formatCurrency(rowTotals?.lineTotal || 0)}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItemRow(index)}
                                  disabled={items.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Row
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bill-notes" className="text-sm font-medium text-[#171f32]">
                    Notes (optional)
                  </label>
                  <Textarea
                    id="bill-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Any notes for this invoice"
                    className="min-h-20 border-[#1f2536]/20"
                  />
                </div>

                <div className="rounded-xl border border-[#1f2536]/10 bg-[#f3f8ff] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-[#1f4f87]" />
                    <p className="text-sm font-semibold text-[#1f4f87]">Quick Calculator</p>
                  </div>
                  <p className="text-xs text-[#5f667b]">Use this for long bill calculations. Tap result into item price or notes.</p>

                  <div className="mt-3 space-y-3">
                    <Input
                      value={calculatorExpression}
                      onChange={(event) => handleCalculatorInputChange(event.target.value)}
                      placeholder="Type expression: (1200+550)/2"
                      className="border-[#1f2536]/20 bg-white"
                    />

                    <div className="grid grid-cols-5 gap-2">
                      {calculatorKeys.map((key) => (
                        <Button
                          key={key}
                          type="button"
                          variant={key === "=" ? "default" : "outline"}
                          className={key === "=" ? "bg-[#171f32] text-[#FCEBCD] hover:bg-[#2b3652]" : ""}
                          onClick={() => handleCalculatorKey(key)}
                        >
                          {key}
                        </Button>
                      ))}
                    </div>

                    <div className="rounded-md border border-[#1f2536]/10 bg-white px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#5f667b]">Result</span>
                        <span className="font-semibold text-[#171f32]">
                          {calculatorResult === null ? "-" : formatCurrency(calculatorResult)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="outline" className="w-full" onClick={applyCalculatorResultToLastPrice}>
                        Use Result In Last Item Price
                      </Button>
                      <Button type="button" variant="outline" className="w-full" onClick={addCalculatorResultToNotes}>
                        Add Result To Notes
                      </Button>
                    </div>

                    {calculatorHistory.length > 0 && (
                      <div className="rounded-md border border-[#1f2536]/10 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Recent</p>
                        <div className="space-y-1 text-xs text-[#3a435a]">
                          {calculatorHistory.map((entry, index) => (
                            <div key={`${entry.expression}-${index}`} className="flex items-center justify-between gap-4">
                              <span className="truncate">{entry.expression}</span>
                              <span className="font-medium">{entry.result}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/70 p-4">
                  <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f667b]">Sub Total</span>
                      <span className="font-medium text-[#171f32]">{formatCurrency(billSummary.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f667b]">Discount</span>
                      <span className="font-medium text-[#171f32]">- {formatCurrency(billSummary.discountTotal)}</span>
                    </div>
                    {taxEnabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#5f667b]">Tax</span>
                        <span className="font-medium text-[#171f32]">{formatCurrency(billSummary.taxTotal)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#1f2536]/15 pt-2 text-base font-semibold text-[#171f32]">
                      <span>Total</span>
                      <span>{formatCurrency(billSummary.total)}</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#2b3652] sm:w-auto"
                    >
                      {isSubmitting ? "Saving..." : "Create Bill"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting || isPrintingPdf}
                      onClick={handleCreateBillAndPdf}
                      className="w-full rounded-full border-[#1f2536]/25 bg-white sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isSubmitting || isPrintingPdf ? "Preparing..." : "Create bill and Pdf"}
                    </Button>
                  </div>
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                Saved Orders / Bills
              </CardTitle>
              <CardDescription>All generated bills for quick month-end cross checking.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-[#5f667b]">No bills yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-3 md:hidden">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-xl border border-[#1f2536]/10 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#171f32]">Invoice #{invoice.id}</p>
                          {invoice.paymentStatus === "paid" ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#3c455e]">{invoice.customerName}</p>
                        <p className="text-xs text-[#5f667b]">{formatDate(invoice.createdAt)}</p>
                        <p className="mt-2 text-xs text-[#5f667b]">{invoice.itemsSummary || `${invoice.itemCount} items`}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#5f667b]">Discount</p>
                            <p className="font-medium text-[#171f32]">{formatCurrency(invoice.discountTotal)}</p>
                          </div>
                          <div>
                            <p className="text-[#5f667b]">Tax</p>
                            <p className="font-medium text-[#171f32]">{formatCurrency(invoice.taxTotal)}</p>
                          </div>
                          <div>
                            <p className="text-[#5f667b]">Total</p>
                            <p className="font-semibold text-[#171f32]">{formatCurrency(invoice.total)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[780px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1f2536]/10 text-[#5f667b]">
                          <th className="px-3 py-2">Invoice</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Items</th>
                          <th className="px-3 py-2">Created</th>
                          <th className="px-3 py-2">Discount</th>
                          <th className="px-3 py-2">Tax</th>
                          <th className="px-3 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-[#1f2536]/10">
                            <td className="px-3 py-2 font-medium">#{invoice.id}</td>
                            <td className="px-3 py-2">{invoice.customerName}</td>
                            <td className="px-3 py-2">{invoice.itemsSummary || `${invoice.itemCount} items`}</td>
                            <td className="px-3 py-2">{formatDate(invoice.createdAt)}</td>
                            <td className="px-3 py-2">{formatCurrency(invoice.discountTotal)}</td>
                            <td className="px-3 py-2">{formatCurrency(invoice.taxTotal)}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(invoice.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Payment Done / Pending</CardTitle>
              <CardDescription>Filter by customer and mark invoices as paid or pending.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-[#5f667b]">No invoices available.</p>
              ) : (
                <div className="space-y-4">
                  <div className="max-w-md space-y-2">
                    <label htmlFor="payment-customer-filter" className="text-sm font-medium text-[#171f32]">
                      Select Customer
                    </label>
                    <select
                      id="payment-customer-filter"
                      value={paymentCustomerFilter}
                      onChange={(event) => setPaymentCustomerFilter(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                    >
                      <option value="all">All Customers</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>
                          {customer.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Paid</p>
                      <p className="text-2xl font-semibold text-emerald-800">{formatCurrency(paymentSummary.paidTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Pending</p>
                      <p className="text-2xl font-semibold text-amber-800">{formatCurrency(paymentSummary.pendingTotal)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {filteredPaymentInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-xl border border-[#1f2536]/10 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#171f32]">Invoice #{invoice.id}</p>
                          {invoice.paymentStatus === "paid" ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#3c455e]">{invoice.customerName}</p>
                        <p className="mt-1 text-sm font-semibold text-[#171f32]">{formatCurrency(invoice.total)}</p>
                        <Button
                          size="sm"
                          variant={invoice.paymentStatus === "paid" ? "outline" : "default"}
                          onClick={() => togglePaymentStatus(invoice)}
                          disabled={isUpdatingStatus}
                          className={`mt-3 w-full ${
                            invoice.paymentStatus === "paid"
                              ? "border-[#1f2536]/20"
                              : "bg-[#171f32] text-[#FCEBCD] hover:bg-[#2b3652]"
                          }`}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {invoice.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1f2536]/10 text-[#5f667b]">
                          <th className="px-3 py-2">Invoice</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPaymentInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-[#1f2536]/10">
                            <td className="px-3 py-2 font-medium">#{invoice.id}</td>
                            <td className="px-3 py-2">{invoice.customerName}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(invoice.total)}</td>
                            <td className="px-3 py-2">
                              {invoice.paymentStatus === "paid" ? (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-700">
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Button
                                size="sm"
                                variant={invoice.paymentStatus === "paid" ? "outline" : "default"}
                                onClick={() => togglePaymentStatus(invoice)}
                                disabled={isUpdatingStatus}
                                className={
                                  invoice.paymentStatus === "paid"
                                    ? "border-[#1f2536]/20"
                                    : "bg-[#171f32] text-[#FCEBCD] hover:bg-[#2b3652]"
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {invoice.paymentStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Customer Account Summary</CardTitle>
              <CardDescription>Pick a customer to see opening balance, paid and pending totals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md space-y-2">
                <label htmlFor="account-customer-filter" className="text-sm font-medium text-[#171f32]">
                  Select Customer
                </label>
                <select
                  id="account-customer-filter"
                  value={accountCustomerFilter}
                  onChange={(event) => setAccountCustomerFilter(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                >
                  <option value="">Choose customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={String(customer.id)}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAccountPdf}
                  disabled={!accountCustomerFilter}
                  className="border-[#1f2536]/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate Account PDF
                </Button>
              </div>

              {!accountCustomerFilter ? (
                <p className="text-sm text-[#5f667b]">Select a customer to view account totals.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#1f2536]/12 bg-[#eef2ff] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Opening Balance</p>
                      <p className="text-2xl font-semibold text-[#171f32]">{formatCurrency(accountSummary.openingBalance)}</p>
                    </div>
                    <div className="rounded-xl border border-[#1f2536]/12 bg-[#f8f3e8]/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Invoice Total</p>
                      <p className="text-2xl font-semibold text-[#171f32]">{formatCurrency(accountSummary.billedTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Total Paid</p>
                      <p className="text-2xl font-semibold text-emerald-800">{formatCurrency(accountSummary.paidTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Total Pending</p>
                      <p className="text-2xl font-semibold text-amber-800">{formatCurrency(accountSummary.pendingTotal)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#1f2536]/10 bg-white/60 p-3 text-sm text-[#36405b]">
                    <p>
                      Lifecycle exposure (opening + invoices):
                      <span className="ml-2 font-semibold text-[#171f32]">{formatCurrency(accountSummary.lifecycleTotal)}</span>
                    </p>
                    <p>
                      Pending from invoices only:
                      <span className="ml-2 font-semibold text-[#171f32]">{formatCurrency(accountSummary.invoicePendingTotal)}</span>
                    </p>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {accountInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-xl border border-[#1f2536]/10 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#171f32]">Invoice #{invoice.id}</p>
                          {invoice.paymentStatus === "paid" ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#5f667b]">{formatDate(invoice.createdAt)}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#5f667b]">Discount</p>
                            <p className="font-medium text-[#171f32]">{formatCurrency(invoice.discountTotal)}</p>
                          </div>
                          <div>
                            <p className="text-[#5f667b]">Tax</p>
                            <p className="font-medium text-[#171f32]">{formatCurrency(invoice.taxTotal)}</p>
                          </div>
                          <div>
                            <p className="text-[#5f667b]">Total</p>
                            <p className="font-semibold text-[#171f32]">{formatCurrency(invoice.total)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1f2536]/10 text-[#5f667b]">
                          <th className="px-3 py-2">Invoice</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Discount</th>
                          <th className="px-3 py-2">Tax</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-[#1f2536]/10">
                            <td className="px-3 py-2 font-medium">#{invoice.id}</td>
                            <td className="px-3 py-2">{formatDate(invoice.createdAt)}</td>
                            <td className="px-3 py-2">{formatCurrency(invoice.discountTotal)}</td>
                            <td className="px-3 py-2">{formatCurrency(invoice.taxTotal)}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(invoice.total)}</td>
                            <td className="px-3 py-2">
                              {invoice.paymentStatus === "paid" ? (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-700">
                                  Pending
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Add / Update Opening Balance and Stock</CardTitle>
              <CardDescription>
                Onboard previous customer dues and maintain category-wise stock purchased vs sold.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSaveOpeningBalance} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="balance-customer-select" className="text-sm font-medium text-[#171f32]">
                      Existing Customer (optional)
                    </label>
                    <select
                      id="balance-customer-select"
                      value={balanceCustomerId}
                      onChange={(event) => handleSelectBalanceCustomer(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-[#1f2536]/20 bg-white px-3 py-2 text-sm text-[#171f32]"
                    >
                      <option value="">Create new customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>
                          {customer.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="balance-customer-name" className="text-sm font-medium text-[#171f32]">
                      Customer Name
                    </label>
                    <Input
                      id="balance-customer-name"
                      value={balanceCustomerName}
                      onChange={(event) => setBalanceCustomerName(event.target.value)}
                      placeholder="Enter customer name"
                      className="border-[#1f2536]/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="balance-amount" className="text-sm font-medium text-[#171f32]">
                      Opening Balance
                    </label>
                    <Input
                      id="balance-amount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={balanceAmount}
                      onChange={(event) => setBalanceAmount(event.target.value)}
                      placeholder="0.00"
                      className="border-[#1f2536]/20"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingBalance}
                  className="w-full rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#2b3652] sm:w-auto"
                >
                  {isSavingBalance ? "Saving..." : "Save Opening Balance"}
                </Button>

                {balanceError && <p className="text-sm text-red-600">{balanceError}</p>}
              </form>

              <form onSubmit={handleSaveStockByCategory} className="space-y-4 rounded-xl border border-[#1f2536]/10 bg-[#f3f8ff]/70 p-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Category Stock Purchased</h3>
                  <p className="mt-1 text-xs text-[#5f667b]">
                    Add stock category-wise to track purchased stock and sold-out quantity from billed orders.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {BILLING_PRODUCT_TYPES.map((productType) => (
                    <div key={`stock-input-${productType}`} className="space-y-2 rounded-lg border border-[#1f2536]/10 bg-white/80 p-3">
                      <label htmlFor={`stock-${productType.toLowerCase().replaceAll(" ", "-")}`} className="text-xs font-medium text-[#5f667b]">
                        {productType}
                      </label>
                      <Input
                        id={`stock-${productType.toLowerCase().replaceAll(" ", "-")}`}
                        type="number"
                        min={0}
                        step="1"
                        value={stockByCategoryInput[productType] ?? "0"}
                        onChange={(event) =>
                          setStockByCategoryInput((current) => ({
                            ...current,
                            [productType]: event.target.value,
                          }))
                        }
                        className="border-[#1f2536]/20"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isSavingStock}
                  className="w-full rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#2b3652] sm:w-auto"
                >
                  {isSavingStock ? "Saving..." : "Save Category Stock"}
                </Button>

                {stockError && <p className="text-sm text-red-600">{stockError}</p>}
              </form>

              <div className="rounded-xl border border-[#1f2536]/10 bg-white/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Stock Overview</h3>
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2536]/10 text-[#5f667b]">
                        <th className="px-3 py-2">Product Type</th>
                        <th className="px-3 py-2">Purchased</th>
                        <th className="px-3 py-2">Sold</th>
                        <th className="px-3 py-2">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockByCategory.map((stock) => (
                        <tr key={`stock-row-${stock.productType}`} className="border-b border-[#1f2536]/10">
                          <td className="px-3 py-2 font-medium text-[#171f32]">{stock.productType}</td>
                          <td className="px-3 py-2">{stock.purchasedQty}</td>
                          <td className="px-3 py-2">{stock.soldQty}</td>
                          <td className={`px-3 py-2 font-semibold ${stock.availableQty < 0 ? "text-red-700" : "text-[#171f32]"}`}>
                            {stock.availableQty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 space-y-2 md:hidden">
                  {stockByCategory.map((stock) => (
                    <div key={`stock-card-${stock.productType}`} className="rounded-lg border border-[#1f2536]/10 bg-[#f8f3e8]/60 p-3">
                      <p className="text-sm font-semibold text-[#171f32]">{stock.productType}</p>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-[#5f667b]">
                        <div>
                          <p>Purchased</p>
                          <p className="font-semibold text-[#171f32]">{stock.purchasedQty}</p>
                        </div>
                        <div>
                          <p>Sold</p>
                          <p className="font-semibold text-[#171f32]">{stock.soldQty}</p>
                        </div>
                        <div>
                          <p>Available</p>
                          <p className={`font-semibold ${stock.availableQty < 0 ? "text-red-700" : "text-[#171f32]"}`}>
                            {stock.availableQty}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Customers With Balance</h3>
                {customersWithOpeningBalance.length === 0 ? (
                  <p className="mt-2 text-sm text-[#5f667b]">No opening balance records yet.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {customersWithOpeningBalance.map((customer) => (
                      <div key={customer.id} className="rounded-lg border border-[#1f2536]/10 bg-white/80 px-3 py-2">
                        <p className="text-sm font-medium text-[#171f32]">{customer.fullName}</p>
                        <p className="text-xs text-[#5f667b]">Opening Balance</p>
                        <p className="text-base font-semibold text-[#171f32]">{formatCurrency(customer.openingBalance)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
