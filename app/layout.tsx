import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import "@/app/globals.css"
import Navbar from "@/components/navbar"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Destination Outfit Recommender",
  description: "Get clothing suggestions based on your destination, weather, and occasion",
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4 md:py-6">
              <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-xs md:text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Destination Outfit Recommender. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
