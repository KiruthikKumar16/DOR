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

interface Outfit {
  id: string;
  name: string;
  destination?: string | null;
  date?: string | null; // Stored as DateTime in Prisma, but might come as ISO string
  occasion?: string | null;
  vibe?: string | null;
  weather?: any; // Can be object or string
  outfit?: any; // Can be object or string
  imageUrl?: string | null;
  culturalNotes?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces for parsed JSON data (matching what the GET /api/outfits/[outfitId] should return)
interface ParsedWeatherData {
    temperature?: number;
    condition?: string;
    precipitation?: string;
}

interface ParsedOutfitStructure {
    top?: string;
    topColor?: string;
    bottom?: string;
    bottomColor?: string;
    shoes?: string;
    shoesColor?: string;
    accessories?: string[];
    accessoriesColor?: string;
    outerwear?: string;
    outerwearColor?: string;
}

export default function OutfitDetailsPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOutfit = async () => {
      if (!user || !id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/outfits/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Outfit not found.')
          } else if (response.status === 401) {
             throw new Error('Unauthorized to view this outfit.')
          }
           throw new Error('Failed to fetch outfit details.')
        }

        const data = await response.json()
        
        // Attempt to parse nested JSON fields if they are strings
        const parsedOutfit = { ...data }
        if (typeof parsedOutfit.weather === 'string') {
            try {
                parsedOutfit.weather = JSON.parse(parsedOutfit.weather)
            } catch (e) {
                console.error('Failed to parse weather JSON:', e)
            }
        }
         if (typeof parsedOutfit.outfit === 'string') {
            try {
                parsedOutfit.outfit = JSON.parse(parsedOutfit.outfit)
            } catch (e) {
                 console.error('Failed to parse outfit structure JSON:', e)
            }
         }

        setOutfit(parsedOutfit as Outfit) // Cast to Outfit type after parsing

      } catch (err: any) {
        setError(err.message)
        toast({
            title: "Error loading outfit",
            description: err.message,
            variant: "destructive"
        })
        console.error('Error fetching outfit details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOutfit()
  }, [id, user, toast])

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const handleDeleteOutfit = async () => {
    try {
      const response = await fetch(`/api/outfits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }

      toast({
        title: "Outfit deleted",
        description: "The outfit has been removed from your wardrobe",
      });

      router.push("/wardrobe");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete outfit. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading outfit...</span>
        </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="container py-12 text-center">
        <p>Outfit not found.</p>
      </div>
    )
  }

  // Helper function to display outfit parts
  const renderOutfitPart = (label: string, value: string | string[] | null | undefined, color?: string | null | undefined) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null
    const displayValue = Array.isArray(value) ? value.join(', ') : value
    return (
        <li className="flex items-start gap-2">
            <span className="font-semibold text-sm">{label}:</span>
            <span className="text-sm">
              {displayValue}
              {color && <span className="text-muted-foreground"> ({color})</span>}
            </span>
        </li>
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
                <CardTitle className="text-2xl">{outfit.name || 'Outfit Details'}</CardTitle>
                <CardDescription>Saved on {new Date(outfit.updatedAt).toLocaleDateString()}</CardDescription>
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
                        alt={`Outfit for ${outfit.destination || 'your trip'}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Outfit Breakdown</h3>
                      <ul className="space-y-2">
                        {renderOutfitPart('Top', (outfit.outfit as ParsedOutfitStructure)?.top, (outfit.outfit as ParsedOutfitStructure)?.topColor)}
                        {renderOutfitPart('Bottom', (outfit.outfit as ParsedOutfitStructure)?.bottom, (outfit.outfit as ParsedOutfitStructure)?.bottomColor)}
                        {renderOutfitPart('Shoes', (outfit.outfit as ParsedOutfitStructure)?.shoes, (outfit.outfit as ParsedOutfitStructure)?.shoesColor)}
                        {renderOutfitPart('Accessories', (outfit.outfit as ParsedOutfitStructure)?.accessories, (outfit.outfit as ParsedOutfitStructure)?.accessoriesColor)}
                        {renderOutfitPart('Outerwear', (outfit.outfit as ParsedOutfitStructure)?.outerwear, (outfit.outfit as ParsedOutfitStructure)?.outerwearColor)}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Weather</h3>
                      <div className="flex flex-wrap items-center gap-2 text-base">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                          <span>{outfit.weather?.temperature}°C</span>
                        </div>
                        <span>{outfit.weather?.condition}</span>
                        <span>Precipitation: {outfit.weather?.precipitation}</span>
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
                        <p>{outfit.destination || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Travel Date</h3>
                        <p>
                          {outfit.date ? new Date(outfit.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Occasion</h3>
                        <p>{outfit.occasion ? occasionMap[outfit.occasion] || outfit.occasion : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Vibe</h3>
                        <p>{outfit.vibe ? vibeMap[outfit.vibe] || outfit.vibe : 'N/A'}</p>
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
