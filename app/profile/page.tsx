"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    height: "",
    weight: "",
    bodyType: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    try {
      setFetching(true)
      const response = await fetch("/api/user/profile")
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const data = await response.json()
      
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        gender: data.preferences?.gender || "",
        height: data.preferences?.height?.toString() || "",
        weight: data.preferences?.weight?.toString() || "",
        bodyType: data.bodyType || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFetching(false)
    }
  }

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          bodyType: formData.bodyType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      setShowSaveSuccess(true)
      const timer = setTimeout(() => {
        setShowSaveSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)

    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        })
        return
      }

      // Validate password length
      if (passwordData.newPassword.length < 8) {
        toast({
          title: "Error",
          description: "New password must be at least 8 characters long",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (!confirmed) {
      return; // Stop if the user cancels
    }

    try {
      // Call the backend API to delete the user and their data
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Show a success message
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });

      // Log the user out after successful deletion
      logout();
      router.push("/login");

    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (fetching) {
    return (
      <div className="container py-6 md:py-12">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 md:py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Your Profile</h1>

        <Tabs defaultValue="profile">
          <TabsContent value="profile" className="pt-4 md:pt-6">
            <Card>
              <CardHeader>
                <CardDescription className="text-sm">
                  Update your personal information to get better outfit recommendations
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm">
                        Full Name
                      </Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm">
                        Gender
                      </Label>
                      <Select onValueChange={(value) => handleSelectChange("gender", value)} value={formData.gender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm">
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        name="height"
                        type="number"
                        placeholder="175"
                        value={formData.height}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-sm">
                        Weight (kg)
                      </Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        placeholder="70"
                        value={formData.weight}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bodyType" className="text-sm">
                        Body Type
                      </Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("bodyType", value)}
                        value={formData.bodyType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select body type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="athletic">Athletic</SelectItem>
                          <SelectItem value="slim">Slim</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="curvy">Curvy</SelectItem>
                          <SelectItem value="plus-size">Plus Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>

              {showSaveSuccess && (
                <div className="mt-4 text-center text-green-600 text-sm">
                  Profile saved successfully!
                </div>
              )}
            </Card>

            {/* Delete Account Button */}
            <Card className="mt-6 border-red-300 dark:border-red-700">
              <CardContent className="flex justify-between items-center py-4">
                 <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                   Danger Zone: Delete your account
                  </div>
                 <Button variant="destructive" onClick={handleDeleteAccount}>
                   Delete Account
                  </Button>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
