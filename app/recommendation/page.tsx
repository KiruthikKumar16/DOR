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
import { getOutfitRecommendation } from '@/lib/api'

interface Outfit {
  top: string;
  bottom: string;
  shoes: string;
  accessories: string[];
  outerwear?: string;
}

interface TransformedResult {
  destination: string;
  date: string;
  occasion: string;
  vibe: string;
  weather: {
    temperature: number;
    condition: string;
    precipitation: string;
  };
  outfits: Outfit[]; // Now an array of outfits
  currentOutfitIndex: number; // Keep track of the currently displayed outfit
  imageUrl: string;
  culturalNotes: string;
}

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
  const [outfitResults, setOutfitResults] = useState<TransformedResult | null>(null) // Store the whole result
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showProfileIncompleteMessage, setShowProfileIncompleteMessage] = useState(false); // New state for incomplete profile message
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setShowLoginDialog(true)
      return
    }

    setLoading(true)
    setOutfitResults(null); // Clear previous results
    setError(null);

    try {
      // Fetch profile data to check if required fields are filled
      console.log('Fetching profile data...');
      const profileResponse = await fetch("/api/user/profile");
      
      if (!profileResponse.ok) {
        console.error('Failed to fetch profile data with status:', profileResponse.status);
        throw new Error("Failed to fetch profile data");
      }

      const profileData = await profileResponse.json();
      console.log('Profile data fetched:', profileData);

      // Check for required profile fields
      const requiredFields = ['gender', 'height', 'weight', 'bodyType'];
      const missingFields = requiredFields.filter(field => {
        // Check both top-level fields and fields within the preferences object
        const fieldValue = profileData[field] !== undefined && profileData[field] !== null && profileData[field] !== '';
        const preferencesFieldValue = profileData.preferences?.[field] !== undefined && profileData.preferences?.[field] !== null && profileData.preferences?.[field] !== '';
        return !fieldValue && !preferencesFieldValue;
      });

      console.log('Missing fields:', missingFields);

      if (missingFields.length > 0) {
        console.log('Profile incomplete, attempting to show toast.');
        setShowProfileIncompleteMessage(true); // Show temporary message
        const messageTimer = setTimeout(() => {
          setShowProfileIncompleteMessage(false);
        }, 5000); // Show message for 5 seconds

        // Redirect to profile page after the message disappears
        const redirectTimer = setTimeout(() => {
          router.push("/profile");
        }, 5000); // Redirect after 5 seconds
        
        setLoading(false);
        
        // Clean up both timers on component unmount or re-run
        return () => {
          clearTimeout(messageTimer);
          clearTimeout(redirectTimer);
        };
      }

      console.log('Profile complete, proceeding with recommendation generation.');

      // Format date to DD/MM/YY
      const date = new Date(formData.travelDate)
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`

      // Get weather data for the destination
      const weatherResponse = await fetch(`/api/weather?destination=${encodeURIComponent(formData.destination)}`);
      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const weatherData = await weatherResponse.json();

      const data = {
        destination: formData.destination,
        date: formattedDate,
        occasion: formData.occasion,
        vibe: formData.vibe
      }

      console.log('Sending recommendation request with data:', data);

      // Use the updated API function and interface
      const result = await getOutfitRecommendation(data)
      
      // Check if there's a weather error
      if (result.weather?.error) {
        setError(result.weather.error);
        setLoading(false);
        return;
      }

      // Transform the API response to match the expected frontend format
      const transformedResult: TransformedResult = {
        destination: formData.destination,
        date: formData.travelDate,
        occasion: formData.occasion,
        vibe: formData.vibe,
        weather: {
          temperature: result.weather.temperature,
          condition: result.weather.description, // Use the description as the climate condition
          precipitation: `${result.weather.precipitation}%`
        },
        outfits: result.outfits || [],
        currentOutfitIndex: 0,
        imageUrl: result.imageUrl || "/placeholder.svg",
        culturalNotes: result.culturalNotes || ""
      }

      // Log the transformed result for debugging
      console.log('Transformed result:', transformedResult);

      // Validate that we have at least one outfit and the first outfit has required fields
      if (!transformedResult.outfits || transformedResult.outfits.length === 0 || !transformedResult.outfits[0]?.top || !transformedResult.outfits[0]?.bottom || !transformedResult.outfits[0]?.shoes) {
        console.error('Invalid outfit data:', transformedResult.outfits);
        throw new Error("Invalid outfit recommendation received - missing required fields");
      }

      setOutfitResults(transformedResult)

      toast({
        title: "Recommendation generated",
        description: "Your outfit recommendation is ready!",
      })
    } catch (error) {
      console.error("Recommendation error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate recommendation. Please try again.");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recommendation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle cycling through outfits or regenerating
  const handleNextOutfit = async (e: React.FormEvent) => {
     // Prevent default behavior if event exists, though not strictly necessary for a synthetic event
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (outfitResults) {
      const nextIndex = outfitResults.currentOutfitIndex + 1;
      if (nextIndex < outfitResults.outfits.length) {
        // Move to the next outfit in the array
        setOutfitResults({
          ...outfitResults,
          currentOutfitIndex: nextIndex
        });
         toast({
          title: "Showing next outfit",
          description: `Displaying outfit ${nextIndex + 1} of ${outfitResults.outfits.length}`,
        });
      } else {
        // If we've shown all outfits, regenerate by submitting the form
        toast({
          title: "Generating more recommendations",
          description: "Fetching a new batch of outfit ideas.",
        });
        await handleSubmit(new Event('submit') as unknown as React.FormEvent);
      }
    }
  };

  // Handle updating a specific outfit in the array after editing
  const handleOutfitUpdate = (updatedOutfit: Outfit, index: number, newImageUrl?: string, culturalNotes?: string) => {
    if (outfitResults) {
      const newOutfits = [...outfitResults.outfits];
      newOutfits[index] = updatedOutfit;

      // Create an updated result object
      const updatedResult = {
        ...outfitResults,
        outfits: newOutfits,
      };

      // Update imageUrl if a new one is provided
      if (newImageUrl !== undefined) {
        updatedResult.imageUrl = newImageUrl;
      }

      // Update culturalNotes if provided (only if not empty to avoid overwriting valid notes with empty ones)
      if (culturalNotes !== undefined && culturalNotes !== null) {
         updatedResult.culturalNotes = culturalNotes;
      }

      setOutfitResults(updatedResult);
    }
  };

  const handleLoginDialogClose = () => {
    setShowLoginDialog(false)
    router.push("/login")
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Get Outfit Recommendation</h1>

      {!outfitResults ? (
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
          result={outfitResults} // Pass the whole results object
          // currentOutfit={outfitResults.outfits[outfitResults.currentOutfitIndex]} // Pass the currently selected outfit - OutfitResult now accesses this internally
          onReset={() => setOutfitResults(null)}
          onRegenerateOutfit={handleNextOutfit} // Call handleNextOutfit to cycle or regenerate
          onUpdateOutfit={handleOutfitUpdate} // Pass the update handler
        />
      )}

      {/* Temporary Profile Incomplete Message */}
      {showProfileIncompleteMessage && (
        <div className="mt-4 text-center text-red-600 text-sm">
          Please complete your profile (Gender, Height, Weight, Body Type) before generating recommendations.
        </div>
      )}

      {error && (
        <div className="mt-4 text-center text-red-600 text-sm">
          {error}
        </div>
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
