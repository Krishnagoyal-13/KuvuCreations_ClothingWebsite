"use client"

import { FormEvent, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Plus, ReceiptText, ShieldCheck, Trash2 } from "lucide-react"

import { useUser } from "@/context/user-context"
import {
  createBillingInvoice,
  logoutAdmin,
  updateBillingPaymentStatus,
  type BillingCustomerOption,
  type BillingInvoiceRecord,
} from "@/lib/admin-actions"
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
  quantity: number
  unitPrice: number
  discountValue: number
  taxPercent: number
}

interface AdminDashboardProps {
  customers: BillingCustomerOption[]
  invoices: BillingInvoiceRecord[]
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString()
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function parseNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getRowTotals(row: BillingRowInput, taxEnabled: boolean) {
  const quantity = Math.max(0, row.quantity || 0)
  const unitPrice = Math.max(0, row.unitPrice || 0)
  const baseTotal = quantity * unitPrice
  const discountValue = clamp(row.discountValue || 0, 0, baseTotal)
  const discountedAmount = baseTotal - discountValue
  const taxPercent = taxEnabled ? Math.max(0, row.taxPercent || 0) : 0
  const taxAmount = (discountedAmount * taxPercent) / 100
  const lineTotal = discountedAmount + taxAmount

  return {
    baseTotal,
    discountValue,
    taxPercent,
    taxAmount,
    lineTotal,
  }
}

export default function AdminDashboard({ customers, invoices }: AdminDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<BillingRowInput[]>([
    { productName: "", quantity: 1, unitPrice: 0, discountValue: 0, taxPercent: 0 },
  ])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [paymentCustomerFilter, setPaymentCustomerFilter] = useState("all")
  const [accountCustomerFilter, setAccountCustomerFilter] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()
  const [isUpdatingStatus, startUpdatingStatus] = useTransition()
  const [isLoggingOut, startLoggingOut] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshAdminStatus } = useUser()

  const calculatedRows = useMemo(() => items.map((row) => getRowTotals(row, taxEnabled)), [items, taxEnabled])

  const billSummary = useMemo(
    () => ({
      subtotal: calculatedRows.reduce((sum, row) => sum + row.baseTotal, 0),
      discountTotal: calculatedRows.reduce((sum, row) => sum + row.discountValue, 0),
      taxTotal: calculatedRows.reduce((sum, row) => sum + row.taxAmount, 0),
      total: calculatedRows.reduce((sum, row) => sum + row.lineTotal, 0),
    }),
    [calculatedRows],
  )

  const filteredPaymentInvoices = useMemo(() => {
    if (paymentCustomerFilter === "all") {
      return invoices
    }
    const customerId = Number(paymentCustomerFilter)
    return invoices.filter((invoice) => invoice.customerId === customerId)
  }, [invoices, paymentCustomerFilter])

  const paymentSummary = useMemo(
    () => ({
      paidTotal: filteredPaymentInvoices
        .filter((invoice) => invoice.paymentStatus === "paid")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      pendingTotal: filteredPaymentInvoices
        .filter((invoice) => invoice.paymentStatus === "pending")
        .reduce((sum, invoice) => sum + invoice.total, 0),
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

  const accountSummary = useMemo(
    () => ({
      billedTotal: accountInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
      paidTotal: accountInvoices
        .filter((invoice) => invoice.paymentStatus === "paid")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      pendingTotal: accountInvoices
        .filter((invoice) => invoice.paymentStatus === "pending")
        .reduce((sum, invoice) => sum + invoice.total, 0),
    }),
    [accountInvoices],
  )

  const handleSelectCustomer = (value: string) => {
    setSelectedCustomer(value)
    const chosenCustomer = customers.find((customer) => String(customer.id) === value)
    if (chosenCustomer) {
      setCustomerName(chosenCustomer.fullName)
    }
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
        if (key === "discountValue") {
          return { ...item, discountValue: parseNumber(value) }
        }
        if (key === "taxPercent") {
          return { ...item, taxPercent: parseNumber(value) }
        }
        return { ...item, productName: value }
      }),
    )
  }

  const addItemRow = () => {
    setItems((currentItems) => [
      ...currentItems,
      { productName: "", quantity: 1, unitPrice: 0, discountValue: 0, taxPercent: 0 },
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

  const handleCreateBill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")

    startSubmitting(async () => {
      const result = await createBillingInvoice({
        customerName,
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

      setSelectedCustomer("")
      setCustomerName("")
      setNotes("")
      setTaxEnabled(false)
      setItems([{ productName: "", quantity: 1, unitPrice: 0, discountValue: 0, taxPercent: 0 }])
      toast({
        title: "Bill created",
        description: `Invoice #${result.invoiceId} saved successfully.`,
      })
      router.refresh()
    })
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

  const handleAdminLogout = () => {
    startLoggingOut(async () => {
      await logoutAdmin()
      await refreshAdminStatus()
      router.refresh()
    })
  }

  return (
    <div className="container space-y-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-[#171f32]">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#5f667b]">Create bills, review orders, and track payment status.</p>
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
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payment Status</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="billing">
          <Card className="border-[#1f2536]/15 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Create Customer Bill</CardTitle>
              <CardDescription>
                Use previous customer list or type a new customer name. All records are saved for month-end checks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBill} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Product Pricing</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-[#1f2536]/15 bg-[#f8f3e8]/70 px-3 py-2">
                    <Checkbox id="tax-enabled" checked={taxEnabled} onCheckedChange={(checked) => setTaxEnabled(checked === true)} />
                    <label htmlFor="tax-enabled" className="cursor-pointer text-sm font-medium text-[#171f32]">
                      Apply Tax
                    </label>
                    <span className="text-xs text-[#5f667b]">Enable tax input if GST/Tax should be applied.</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#1f2536]/10">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead className="bg-[#f8f3e8]/70 text-[#5f667b]">
                        <tr className="border-b border-[#1f2536]/10">
                          <th className="px-2 py-2 text-left">Product</th>
                          <th className="px-2 py-2 text-left">Quantity</th>
                          <th className="px-2 py-2 text-left">Unit Price</th>
                          <th className="px-2 py-2 text-left">Discount</th>
                          {taxEnabled && <th className="px-2 py-2 text-left">Tax %</th>}
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
                                  step="0.01"
                                  value={item.discountValue}
                                  onChange={(event) => updateItem(index, "discountValue", event.target.value)}
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

                <div className="flex flex-col gap-4 rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/70 p-4 sm:flex-row sm:items-start sm:justify-between">
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
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#2b3652] sm:w-auto"
                  >
                    {isSubmitting ? "Saving..." : "Create Bill"}
                  </Button>
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
                <div className="overflow-x-auto">
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

                  <div className="overflow-x-auto">
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
              <CardDescription>Pick a customer to see paid and pending totals.</CardDescription>
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

              {!accountCustomerFilter ? (
                <p className="text-sm text-[#5f667b]">Select a customer to view account totals.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-[#1f2536]/12 bg-[#f8f3e8]/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f667b]">Total Billed</p>
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

                  <div className="overflow-x-auto">
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
      </Tabs>
    </div>
  )
}
