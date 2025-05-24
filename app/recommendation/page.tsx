"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MapPin, Calendar, Tag, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import OutfitResult from "@/components/outfit-result"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function RecommendationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    destination: "",
    travelDate: "",
    occasion: "",
    vibe: "",
  })

  const [loading, setLoading] = useState(false)
  const [outfitResult, setOutfitResult] = useState<any>(null)
  const [usedOutfitIndices, setUsedOutfitIndices] = useState<number[]>([])
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Define a set of outfits to choose from
  const outfitOptions = [
    {
      top: "Light cotton shirt",
      bottom: "Chino pants",
      shoes: "Casual loafers",
      accessories: ["Sunglasses", "Watch"],
      outerwear: "Light jacket",
    },
    {
      top: "Linen button-up shirt",
      bottom: "Slim fit jeans",
      shoes: "White sneakers",
      accessories: ["Sunglasses", "Leather bracelet"],
      outerwear: "Lightweight cardigan",
    },
    {
      top: "Polo shirt",
      bottom: "Khaki shorts",
      shoes: "Boat shoes",
      accessories: ["Panama hat", "Leather belt"],
      outerwear: undefined,
    },
    {
      top: "Henley shirt",
      bottom: "Dark jeans",
      shoes: "Chelsea boots",
      accessories: ["Minimalist watch", "Leather wallet"],
      outerwear: "Denim jacket",
    },
    {
      top: "V-neck t-shirt",
      bottom: "Linen trousers",
      shoes: "Espadrilles",
      accessories: ["Woven bracelet", "Aviator sunglasses"],
      outerwear: undefined,
    },
    {
      top: "Chambray shirt",
      bottom: "Chino shorts",
      shoes: "Canvas sneakers",
      accessories: ["Woven belt", "Straw hat"],
      outerwear: undefined,
    },
    {
      top: "Graphic tee",
      bottom: "Cargo shorts",
      shoes: "Hiking sandals",
      accessories: ["Bandana", "Sports watch"],
      outerwear: "Lightweight windbreaker",
    },
    {
      top: "Oxford button-down",
      bottom: "Tailored trousers",
      shoes: "Penny loafers",
      accessories: ["Leather belt", "Dress watch"],
      outerwear: "Blazer",
    },
  ]

  const generateOutfitRecommendation = async (formValues = formData) => {
    // In a real app, you would make an API call to your backend
    // Mock API response
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Get available outfit indices (ones we haven't used yet)
    let availableIndices = Array.from({ length: outfitOptions.length }, (_, i) => i).filter(
      (i) => !usedOutfitIndices.includes(i),
    )

    // If we've used all outfits, reset
    if (availableIndices.length === 0) {
      availableIndices = Array.from({ length: outfitOptions.length }, (_, i) => i)
      setUsedOutfitIndices([])
    }

    // Pick a random outfit from the available options
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]

    // Add this index to used indices
    setUsedOutfitIndices((prev) => [...prev, randomIndex])

    // Get the outfit
    const randomOutfit = outfitOptions[randomIndex]

    // Generate weather data
    const weatherOptions = [
      { temperature: 22, condition: "Sunny", precipitation: "0%" },
      { temperature: 24, condition: "Partly cloudy", precipitation: "10%" },
      { temperature: 20, condition: "Clear skies", precipitation: "5%" },
      { temperature: 26, condition: "Light breeze", precipitation: "0%" },
      { temperature: 18, condition: "Overcast", precipitation: "20%" },
    ]

    const randomWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)]

    return {
      destination: formValues.destination,
      date: formValues.travelDate,
      occasion: formValues.occasion,
      vibe: formValues.vibe,
      weather: randomWeather,
      outfit: randomOutfit,
      imageUrl: "/placeholder.svg?height=400&width=300",
      culturalNotes: "Casual attire is acceptable for most venues in this destination.",
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setShowLoginDialog(true)
      return
    }

    setLoading(true)

    try {
      const result = await generateOutfitRecommendation()
      setOutfitResult(result)

      toast({
        title: "Recommendation generated",
        description: "Your outfit recommendation is ready!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate recommendation. Please try again.",
        variant: "destructive",
      })
      console.error("Recommendation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateOutfit = async () => {
    if (!user) {
      setShowLoginDialog(true)
      return
    }

    try {
      const newResult = await generateOutfitRecommendation()
      setOutfitResult(newResult)
      return Promise.resolve()
    } catch (error) {
      console.error("Regeneration error:", error)
      return Promise.reject(error)
    }
  }

  const handleLoginDialogClose = () => {
    setShowLoginDialog(false)
    router.push("/login")
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Get Outfit Recommendation</h1>

      {!outfitResult ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Enter Trip Details</CardTitle>
            <CardDescription>
              Provide information about your trip to get personalized outfit recommendations
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </div>
                </Label>
                <Input
                  id="destination"
                  name="destination"
                  placeholder="e.g., Paris, France"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelDate">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Travel Date
                  </div>
                </Label>
                <Input
                  id="travelDate"
                  name="travelDate"
                  type="date"
                  value={formData.travelDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Occasion
                  </div>
                </Label>
                <Select onValueChange={(value) => handleSelectChange("occasion", value)} value={formData.occasion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business Meeting</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="casual">Casual Trip</SelectItem>
                    <SelectItem value="formal">Formal Event</SelectItem>
                    <SelectItem value="beach">Beach Vacation</SelectItem>
                    <SelectItem value="hiking">Outdoor/Hiking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vibe">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Vibe
                  </div>
                </Label>
                <Select onValueChange={(value) => handleSelectChange("vibe", value)} value={formData.vibe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vibe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aesthetic">Aesthetic</SelectItem>
                    <SelectItem value="sporty">Sporty</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="bohemian">Bohemian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating recommendation...
                  </>
                ) : (
                  "Recommend Outfit"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <OutfitResult
          result={outfitResult}
          onReset={() => setOutfitResult(null)}
          onRegenerateOutfit={handleRegenerateOutfit}
        />
      )}

      <Dialog open={showLoginDialog} onOpenChange={handleLoginDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to get outfit recommendations. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleLoginDialogClose}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
