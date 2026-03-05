"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/user-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Heart, User, LogOut } from "lucide-react"

export default function AccountPage() {
  const { user, isLoading, logout } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max gap-1 p-1">
            <TabsTrigger value="profile" className="min-w-[110px]">
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="min-w-[110px]">
              Orders
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="min-w-[110px]">
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="addresses" className="min-w-[110px]">
              Addresses
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">First Name</h3>
                  <p className="font-medium">{user.firstName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Name</h3>
                  <p className="font-medium">{user.lastName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline">Edit Profile</Button>
                <Button variant="outline">Change Password</Button>
                <Button variant="outline" className="text-red-500" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View and track your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
                <Button className="bg-rose-500 hover:bg-rose-600" asChild>
                  <a href="/products">Start Shopping</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist">
          <Card>
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>Items you've saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Save items you love to your wishlist by clicking the heart icon.
                </p>
                <Button className="bg-rose-500 hover:bg-rose-600" asChild>
                  <a href="/products">Explore Products</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
              <CardDescription>Manage your shipping and billing addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                <p className="text-muted-foreground mb-6">Add addresses to make checkout faster.</p>
                <Button variant="outline">Add New Address</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
