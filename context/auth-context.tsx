"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { signIn, signOut, useSession } from "next-auth/react"

type User = {
  id: string
  name: string
  email: string
  gender?: string
  height?: number
  weight?: number
  bodyType?: string
}

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (userData: any) => Promise<void>
  logout: () => void
  loading: boolean
  updateProfile: (profileData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const user = session?.user ? {
    id: (session.user as SessionUser).id,
    name: session.user.name || '',
    email: session.user.email || '',
  } : null

  useEffect(() => {
    setLoading(status === "loading")
  }, [status])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        // Handle specific error cases
        if (result?.error === "Invalid credentials") {
          throw new Error("Invalid email or password")
        } else if (result?.error === "No account found with this email") {
          throw new Error("No account found with this email")
        } else if (result?.error === "Invalid password") {
          throw new Error("Invalid password")
        } else {
          throw new Error(result?.error || "An error occurred during login")
        }
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      router.push("/")
    } catch (error) {
      // Re-throw the error to be handled by the login page
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // After successful signup, log the user in
      await login(userData.email, userData.password)

      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      })
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
      console.error("Signup error:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Refresh the session to get updated user data
      await router.refresh()
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
      console.error("Profile update error:", error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/")
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
