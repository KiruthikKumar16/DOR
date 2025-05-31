"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(formData.email, formData.password)
      router.push("/profile")
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Failed to login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send reset email")
      }

      toast({
        title: "Success",
        description: "If an account exists, you will receive a password reset email",
      })

      setForgotPasswordEmail("")
      setShowForgotPassword(false)
      setForgotPasswordSuccess(true)
    } catch (error) {
      console.error("Forgot password error:", error)
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const result = await signIn("google", { 
        callbackUrl: "/",
        redirect: true
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Failed to login with Google. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
              <Button
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
              {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
            </Button>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-password-email">Email</Label>
                <Input
                  id="forgot-password-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={forgotPasswordSuccess} onOpenChange={setForgotPasswordSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Link Sent</DialogTitle>
            <DialogDescription>
              A password reset link has been sent to your email. Please check your inbox (and spam folder) to reset your password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setForgotPasswordSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
