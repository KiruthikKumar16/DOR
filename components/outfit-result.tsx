"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Save, Edit, ThermometerSun, MapPin, Calendar, Tag, Sparkles } from "lucide-react"
import OutfitEditor from "@/components/outfit-editor"

type OutfitResultProps = {
  result: {
    destination: string
    date: string
    occasion: string
    vibe: string
    weather: {
      temperature: number
      condition: string
      precipitation: string
    }
    outfit: {
      top: string
      bottom: string
      shoes: string
      accessories: string[]
      outerwear?: string
    }
    imageUrl: string
    culturalNotes: string
  }
  onReset: () => void
  onRegenerateOutfit: () => Promise<void>
}

export default function OutfitResult({ result, onReset, onRegenerateOutfit }: OutfitResultProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentOutfit, setCurrentOutfit] = useState(result.outfit)

  const handleSaveOutfit = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...result,
          outfit: currentOutfit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save outfit');
      }

      toast({
        title: "Outfit saved",
        description: "Your outfit has been saved to your wardrobe",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save outfit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateOutfit = async () => {
    setRegenerating(true)
    try {
      await onRegenerateOutfit()
      toast({
        title: "New outfit generated",
        description: "We've created a new outfit recommendation for you",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate a new outfit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegenerating(false)
    }
  }

  const handleEditOutfit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = (editedOutfit: typeof result.outfit) => {
    setCurrentOutfit(editedOutfit)
    setIsEditing(false)
    toast({
      title: "Outfit updated",
      description: "Your outfit has been updated successfully",
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
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

  if (isEditing) {
    return <OutfitEditor outfit={currentOutfit} onSave={handleSaveEdit} onCancel={handleCancelEdit} />
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Your Outfit Recommendation</CardTitle>
          <CardDescription className="text-sm md:text-base">Based on your trip details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="outfit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="outfit" className="text-xs md:text-sm">
                Outfit
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs md:text-sm">
                Trip Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="outfit" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <div className="relative w-full max-w-[250px] md:max-w-[300px] h-[300px] md:h-[400px] bg-muted rounded-md overflow-hidden">
                    <Image
                      src={result.imageUrl || "/placeholder.svg"}
                      alt="Outfit recommendation"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Recommended Outfit</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Top
                        </Badge>
                        <span className="text-sm md:text-base">{currentOutfit.top}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Bottom
                        </Badge>
                        <span className="text-sm md:text-base">{currentOutfit.bottom}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Shoes
                        </Badge>
                        <span className="text-sm md:text-base">{currentOutfit.shoes}</span>
                      </li>
                      {currentOutfit.outerwear && (
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 text-xs">
                            Outerwear
                          </Badge>
                          <span className="text-sm md:text-base">{currentOutfit.outerwear}</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          Accessories
                        </Badge>
                        <span className="text-sm md:text-base">{currentOutfit.accessories.join(", ")}</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Weather</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="h-4 w-4" />
                        <span>{result.weather.temperature}°C</span>
                      </div>
                      <div>{result.weather.condition}</div>
                      <div>Precipitation: {result.weather.precipitation}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Cultural Notes</h3>
                    <p className="text-muted-foreground text-sm md:text-base">{result.culturalNotes}</p>
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
                      <h3 className="font-medium text-sm md:text-base">Destination</h3>
                      <p className="text-sm md:text-base">{result.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-sm md:text-base">Travel Date</h3>
                      <p className="text-sm md:text-base">
                        {new Date(result.date).toLocaleDateString("en-US", {
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
                      <h3 className="font-medium text-sm md:text-base">Occasion</h3>
                      <p className="text-sm md:text-base">{occasionMap[result.occasion] || result.occasion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-sm md:text-base">Style</h3>
                      <p className="text-sm md:text-base">{vibeMap[result.vibe] || result.vibe}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onReset}>
            Start Over
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditOutfit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={handleSaveOutfit} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Outfit"}
            </Button>
            <Button variant="outline" onClick={handleRegenerateOutfit} disabled={regenerating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
