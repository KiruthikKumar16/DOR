"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="destination-outfit-theme"
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  )
} 