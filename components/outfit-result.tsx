"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Save, Edit, ThermometerSun, MapPin, Calendar, Tag, Sparkles, Loader2, Cloud, CloudRain } from "lucide-react"
import OutfitEditor from "@/components/outfit-editor"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Outfit {
  top: string;
  topColor?: string;
  bottom: string;
  bottomColor?: string;
  shoes: string;
  shoesColor?: string;
  accessories: string[];
  accessoriesColor?: string;
  outerwear?: string;
  outerwearColor?: string;
}

interface OutfitResultProps {
  result: {
    destination: string;
    date: string;
    occasion: string;
    vibe: string;
    weather: {
      temperature: number;
      condition: string;
      precipitation: string;
    };
    outfits: Outfit[];
    currentOutfitIndex: number;
    imageUrl: string;
    culturalNotes: string;
  };
  onReset: () => void;
  onRegenerateOutfit: (e: React.FormEvent) => Promise<void>;
  onUpdateOutfit: (updatedOutfit: Outfit, index: number) => void;
}

export default function OutfitResult({ result, onReset, onRegenerateOutfit, onUpdateOutfit }: OutfitResultProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveSuccessMessage, setShowSaveSuccessMessage] = useState(false);
  
  const currentOutfit = result.outfits?.[result.currentOutfitIndex] || {
    top: "No outfit available",
    bottom: "No outfit available",
    shoes: "No outfit available",
    accessories: ["No accessories available"]
  };

  if (!result.outfits || result.outfits.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">No Outfit Available</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Unable to generate an outfit recommendation. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={onReset} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleSaveOutfit = async () => {
    setSaving(true);
    console.log('Attempting to save outfit...');

    try {
      console.log('Sending POST request to /api/outfits...');
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: result.destination,
          date: result.date,
          occasion: result.occasion,
          vibe: result.vibe,
          weather: result.weather,
          outfit: currentOutfit,
          culturalNotes: result.culturalNotes,
          imageUrl: result.imageUrl
        }),
      });

      console.log('Received response:', response.status, response.statusText);

      if (!response.ok) {
        console.error('Response not OK:', response.status);
        throw new Error('Failed to save outfit');
      }

      console.log('Response OK, showing success toast...');
      toast({
        title: "Outfit saved successfully!",
        description: "Your outfit has been saved to your wardrobe.",
      })
      setShowSaveSuccessMessage(true);
      setTimeout(() => {
        setShowSaveSuccessMessage(false);
      }, 5000); // Hide message after 5 seconds
    } catch (error) {
      console.error("Save outfit error in catch block:", error);
      toast({
        title: "Error",
        description: "Failed to save outfit. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log('Save outfit operation finished.');
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const event = new Event('submit') as unknown as React.FormEvent
      await onRegenerateOutfit(event)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new recommendation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRegenerating(false)
    }
  }

  const handleEditOutfit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = (editedOutfit: Outfit) => {
    onUpdateOutfit(editedOutfit, result.currentOutfitIndex)
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
          {result.outfits.length > 1 && (
            <CardDescription className="text-sm md:text-base">Outfit {result.currentOutfitIndex + 1} of {result.outfits.length}</CardDescription>
          )}
          {! (result.outfits.length > 1) && (
          <CardDescription className="text-sm md:text-base">Based on your trip details and preferences</CardDescription>
          )}
           {showSaveSuccessMessage && (
            <p className="text-green-500 text-sm mt-2">Outfit saved successfully!</p>
          )}
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
                    <img
                      src="/placeholder.svg"
                      alt="Outfit recommendation"
                      style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        inset: '0px',
                        objectFit: 'cover',
                        backgroundColor: 'hsl(var(--muted))'
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Recommended Outfit</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                          Top
                        </Badge>
                        <span className="text-sm md:text-base ml-2">
                          {currentOutfit.top}
                          {currentOutfit.topColor && <span className="text-muted-foreground"> ({currentOutfit.topColor})</span>}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                          Bottom
                        </Badge>
                        <span className="text-sm md:text-base ml-2">
                          {currentOutfit.bottom}
                          {currentOutfit.bottomColor && <span className="text-muted-foreground"> ({currentOutfit.bottomColor})</span>}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                          Shoes
                        </Badge>
                        <span className="text-sm md:text-base ml-2">
                          {currentOutfit.shoes}
                          {currentOutfit.shoesColor && <span className="text-muted-foreground"> ({currentOutfit.shoesColor})</span>}
                        </span>
                      </li>
                      {currentOutfit.outerwear && (
                        <li className="flex items-start">
                          <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                            Outerwear
                          </Badge>
                          <span className="text-sm md:text-base ml-2">
                            {currentOutfit.outerwear}
                            {currentOutfit.outerwearColor && <span className="text-muted-foreground"> ({currentOutfit.outerwearColor})</span>}
                          </span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                          Accessories
                        </Badge>
                        <span className="text-sm md:text-base ml-2">
                          {currentOutfit.accessories.join(", ")}
                          {currentOutfit.accessoriesColor && <span className="text-muted-foreground"> ({currentOutfit.accessoriesColor})</span>}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Weather</h3>
                    <div className="space-y-2 text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="h-4 w-4" />
                        <span>{result.weather.temperature}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        <span className="capitalize">{result.weather.condition}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-4 w-4" />
                        <span>Precipitation: {result.weather.precipitation}</span>
                      </div>
                    </div>
                  </div>

                  {result.culturalNotes && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Cultural Notes</h3>
                      <p className="text-sm md:text-base italic">{result.culturalNotes}</p>
                  </div>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="pt-4">
             <div className="space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Trip Details</h3>
                    <div className="space-y-2 text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Destination: {result.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date: {result.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span>Occasion: {occasionMap[result.occasion] || result.occasion}</span>
                      </div>
                  <div className="flex items-center gap-2">
                         <Sparkles className="mr-2 h-4 w-4" />
                         <span>Vibe: {vibeMap[result.vibe] || result.vibe}</span>
                       </div>
                    </div>
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

                   {result.culturalNotes && (
                    <div>
                      <h3 className="text-base md:text-lg font-semibold mb-2">Cultural Notes</h3>
                      <p className="text-sm md:text-base italic">{result.culturalNotes}</p>
                    </div>
                  )}



              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 md:flex-row md:justify-between">
          <Button variant="outline" onClick={onReset} className="w-full md:w-auto">
            Start Over
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:w-auto">
            <Button variant="outline" onClick={handleEditOutfit} className="w-full md:w-auto" disabled={saving || regenerating}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={handleSaveOutfit} className="w-full md:w-auto" disabled={saving || regenerating || isEditing}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Outfit
            </Button>
            <Button onClick={handleRegenerate} className="w-full md:w-auto" disabled={regenerating || saving || isEditing}>
              {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Generate New Recommendation
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
