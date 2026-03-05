import AdminDashboard from "@/components/admin/admin-dashboard"
import AdminLoginCard from "@/components/admin/admin-login-card"
import { getAdminSessionStatus, getBillingDashboardData } from "@/lib/admin-actions"

export default async function AdminPage() {
  const hasAdminAccess = await getAdminSessionStatus()

  if (!hasAdminAccess) {
    return <AdminLoginCard />
  }

  try {
    const { customers, invoices, stockByCategory } = await getBillingDashboardData()
    return <AdminDashboard customers={customers} invoices={invoices} stockByCategory={stockByCategory} />
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error)
    return (
      <div className="container py-10">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Could not load billing data. Check your database connection and try again.
        </div>
      </div>
    )
  }
}
