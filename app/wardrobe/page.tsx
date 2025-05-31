"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Calendar, Tag, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function WardrobePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [outfits, setOutfits] = useState<any[]>([])

  // Define fetchOutfits outside useEffect
    const fetchOutfits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch outfits from the backend API
      const response = await fetch('/api/outfits');

      if (!response.ok) {
        throw new Error('Failed to fetch outfits');
      }

      const data = await response.json();
      setOutfits(data);

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your wardrobe. Please try again.",
          variant: "destructive",
        })
        console.error("Wardrobe error:", error)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    if (user) {
      fetchOutfits();
    }
  }, [user, toast]); // Add toast to dependency array

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }

      toast({
        title: "Outfit deleted",
        description: "The outfit has been removed from your wardrobe",
      });

      // Refresh the outfits list
      fetchOutfits();
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

  return (
    <div className="container py-6 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Wardrobe</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage your saved outfit recommendations</p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/recommendation">Get New Recommendation</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-sm md:text-base">Loading your wardrobe...</span>
        </div>
      ) : outfits.length === 0 ? (
        <Card className="text-center py-8 md:py-12">
          <CardContent>
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold">Your wardrobe is empty</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Get outfit recommendations and save them to your wardrobe
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/recommendation">Get Recommendation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {outfits.map((outfit) => (
            <Card key={outfit.id} className="overflow-hidden">
              <div className="relative h-[150px] md:h-[200px] w-full">
                <Image
                  src={outfit.imageUrl || "/placeholder.svg"}
                  alt={`Outfit for ${outfit.destination}`}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg truncate">{outfit.destination}</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {occasionMap[outfit.occasion] || outfit.occasion}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteOutfit(outfit.id)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(outfit.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{outfit.vibe}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-xs md:text-sm" asChild>
                  <Link href={`/wardrobe/${outfit.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
