import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/user-context"
import MockDataNotice from "@/components/mock-data-notice"

const inter = Inter({ subsets: ["latin"] })

// Update the metadata with our brand name
export const metadata: Metadata = {
  title: "Kuvu Creations | Women's Fashion Boutique",
  description:
    "Discover the latest trends in women's fashion at Kuvu Creations. Shop dresses, tops, bottoms, and accessories.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <UserProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <MockDataNotice />
            </div>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
