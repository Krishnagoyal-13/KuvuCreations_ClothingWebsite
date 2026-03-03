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

interface BillingRowInput {
  productName: string
  quantity: number
  unitPrice: number
}

interface AdminDashboardProps {
  customers: BillingCustomerOption[]
  invoices: BillingInvoiceRecord[]
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString()
}

export default function AdminDashboard({ customers, invoices }: AdminDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<BillingRowInput[]>([{ productName: "", quantity: 1, unitPrice: 0 }])
  const [formError, setFormError] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()
  const [isUpdatingStatus, startUpdatingStatus] = useTransition()
  const [isLoggingOut, startLoggingOut] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshAdminStatus } = useUser()

  const calculatedTotal = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitPrice || 0), 0),
    [items],
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
          return { ...item, quantity: Number(value) || 0 }
        }
        if (key === "unitPrice") {
          return { ...item, unitPrice: Number(value) || 0 }
        }
        return { ...item, productName: value }
      }),
    )
  }

  const addItemRow = () => {
    setItems((currentItems) => [...currentItems, { productName: "", quantity: 1, unitPrice: 0 }])
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
      setItems([{ productName: "", quantity: 1, unitPrice: 0 }])
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
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payment Status</TabsTrigger>
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
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#171f32]">Products</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-[#1f2536]/10 p-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <label className="text-xs text-[#5f667b]">Product</label>
                          <Input
                            value={item.productName}
                            onChange={(event) => updateItem(index, "productName", event.target.value)}
                            placeholder="Product name"
                            className="border-[#1f2536]/20"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-[#5f667b]">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => updateItem(index, "quantity", event.target.value)}
                            className="border-[#1f2536]/20"
                            required
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs text-[#5f667b]">Unit Price</label>
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
                        <div className="flex items-end md:col-span-1">
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
                      </div>
                    ))}
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

                <div className="flex flex-col gap-3 rounded-xl border border-[#1f2536]/10 bg-[#f8f3e8]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#5f667b]">Invoice Total</p>
                    <p className="text-2xl font-semibold text-[#171f32]">${calculatedTotal.toFixed(2)}</p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#2b3652]"
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
                          <td className="px-3 py-2 font-semibold">${invoice.total.toFixed(2)}</td>
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
              <CardDescription>Mark invoices as paid or pending.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-[#5f667b]">No invoices available.</p>
              ) : (
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
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-[#1f2536]/10">
                          <td className="px-3 py-2 font-medium">#{invoice.id}</td>
                          <td className="px-3 py-2">{invoice.customerName}</td>
                          <td className="px-3 py-2 font-semibold">${invoice.total.toFixed(2)}</td>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
