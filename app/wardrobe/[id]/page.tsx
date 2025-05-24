"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, ThermometerSun, MapPin, Calendar, Tag, Sparkles, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function OutfitDetailsPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [outfit, setOutfit] = useState<any>(null)

  useEffect(() => {
    const fetchOutfitDetails = async () => {
      if (!user) return

      try {
        // In a real app, you would make an API call to your backend
        // Mock API response
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Mock outfit data based on ID
        const mockOutfits = {
          "1": {
            id: "1",
            destination: "Paris, France",
            date: "2023-07-15",
            occasion: "casual",
            vibe: "minimal",
            weather: {
              temperature: 24,
              condition: "Sunny",
              precipitation: "0%",
            },
            outfit: {
              top: "White linen shirt",
              bottom: "Beige chino pants",
              shoes: "Brown loafers",
              accessories: ["Sunglasses", "Watch"],
              outerwear: null,
            },
            imageUrl: "/placeholder.svg?height=400&width=300",
            saved: "2023-05-10",
            culturalNotes:
              "Casual attire is acceptable in most Parisian venues, but locals tend to dress smartly even for casual occasions.",
          },
          "2": {
            id: "2",
            destination: "Tokyo, Japan",
            date: "2023-09-22",
            occasion: "business",
            vibe: "elegant",
            weather: {
              temperature: 20,
              condition: "Partly cloudy",
              precipitation: "10%",
            },
            outfit: {
              top: "Light blue dress shirt",
              bottom: "Navy slacks",
              shoes: "Black oxford shoes",
              accessories: ["Tie", "Leather briefcase"],
              outerwear: "Light blazer",
            },
            imageUrl: "/placeholder.svg?height=400&width=300",
            saved: "2023-06-05",
            culturalNotes:
              "Business attire in Tokyo is typically conservative. Dark suits are common for business meetings.",
          },
          "3": {
            id: "3",
            destination: "Bali, Indonesia",
            date: "2023-12-10",
            occasion: "beach",
            vibe: "bohemian",
            weather: {
              temperature: 30,
              condition: "Sunny",
              precipitation: "0%",
            },
            outfit: {
              top: "Floral print shirt",
              bottom: "Linen shorts",
              shoes: "Sandals",
              accessories: ["Straw hat", "Sunglasses"],
              outerwear: null,
            },
            imageUrl: "/placeholder.svg?height=400&width=300",
            saved: "2023-07-20",
            culturalNotes:
              "Lightweight, breathable clothing is recommended for Bali's tropical climate. When visiting temples, shoulders and knees should be covered.",
          },
        }

        // @ts-ignore - We know the ID is a string
        const outfitData = mockOutfits[id]

        if (outfitData) {
          setOutfit(outfitData)
        } else {
          toast({
            title: "Outfit not found",
            description: "The requested outfit could not be found",
            variant: "destructive",
          })
          router.push("/wardrobe")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load outfit details. Please try again.",
          variant: "destructive",
        })
        console.error("Outfit details error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOutfitDetails()
  }, [id, user, router, toast])

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const handleDeleteOutfit = async () => {
    try {
      // In a real app, you would make an API call to your backend
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Outfit deleted",
        description: "The outfit has been removed from your wardrobe",
      })

      router.push("/wardrobe")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete outfit. Please try again.",
        variant: "destructive",
      })
    }
  }

  const occasionMap: Record<string, string> = {
    business: "Business Meeting",
    wedding: "Wedding",
    casual: "Casual Trip",
    formal: "Formal Event",
    beach: "Beach Vacation",
    hiking: "Outdoor/Hiking",
  }

  const vibeMap: Record<string, string> = {
    aesthetic: "Aesthetic",
    sporty: "Sporty",
    minimal: "Minimal",
    cool: "Cool",
    elegant: "Elegant",
    bohemian: "Bohemian",
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading outfit details...</span>
        </div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="container py-12">
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Outfit not found</h2>
              <p className="text-muted-foreground">The requested outfit could not be found</p>
              <Button asChild>
                <Link href="/wardrobe">Back to Wardrobe</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/wardrobe">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wardrobe
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Outfit Details</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{outfit.destination}</CardTitle>
                <CardDescription>Saved on {new Date(outfit.saved).toLocaleDateString()}</CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteOutfit}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Outfit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="outfit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="outfit">Outfit</TabsTrigger>
                <TabsTrigger value="details">Trip Details</TabsTrigger>
              </TabsList>
              <TabsContent value="outfit" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-[300px] h-[400px] bg-muted rounded-md overflow-hidden">
                      <Image
                        src={outfit.imageUrl || "/placeholder.svg"}
                        alt="Outfit recommendation"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Recommended Outfit</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            Top
                          </Badge>
                          <span>{outfit.outfit.top}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            Bottom
                          </Badge>
                          <span>{outfit.outfit.bottom}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            Shoes
                          </Badge>
                          <span>{outfit.outfit.shoes}</span>
                        </li>
                        {outfit.outfit.outerwear && (
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">
                              Outerwear
                            </Badge>
                            <span>{outfit.outfit.outerwear}</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            Accessories
                          </Badge>
                          <span>{outfit.outfit.accessories.join(", ")}</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Weather</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="h-4 w-4" />
                          <span>{outfit.weather.temperature}°C</span>
                        </div>
                        <div>{outfit.weather.condition}</div>
                        <div>Precipitation: {outfit.weather.precipitation}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Cultural Notes</h3>
                      <p className="text-muted-foreground">{outfit.culturalNotes}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Destination</h3>
                        <p>{outfit.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Travel Date</h3>
                        <p>
                          {new Date(outfit.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Occasion</h3>
                        <p>{occasionMap[outfit.occasion] || outfit.occasion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Vibe</h3>
                        <p>{vibeMap[outfit.vibe] || outfit.vibe}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
