import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react"
import { getCustomersWithDetails } from "@/app/actions/customers"
import CustomersClient from "./customers-client"

export default async function CustomersPage() {
  const { customers: customerData, error } = await getCustomersWithDetails()

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Customers</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: customerData.length,
    active: customerData.filter((c: any) => c.status === "active").length,
    inactive: customerData.filter((c: any) => c.status === "inactive").length,
    newThisMonth: customerData.filter((c: any) => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return new Date(c.joinedDate) >= startOfMonth
    }).length,
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="liquid-glass border-white/10 hover:border-red-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-white/60 mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-green-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Active Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
              <p className="text-xs text-white/60 mt-1">Currently engaged</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-gray-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inactive}</div>
              <p className="text-xs text-white/60 mt-1">No recent activity</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-blue-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.newThisMonth}</div>
              <p className="text-xs text-white/60 mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                New registrations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client Component for Interactive Features */}
        <CustomersClient initialCustomers={customerData} initialStats={stats} />
      </div>
    </div>
  )
}
