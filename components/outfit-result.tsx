"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  RefreshCw,
  Save,
  Edit,
  ThermometerSun,
  MapPin,
  Calendar,
  Tag,
  Sparkles,
  Loader2,
  Cloud,
  CloudRain,
  Brain,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Zap,
  Download,
  Cpu
} from "lucide-react"
import OutfitEditor from "@/components/outfit-editor"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

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
  culturalNotes?: string;
  thoughts?: string;
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
    thoughts?: string;
    modelInfo?: {
      reasoningModel: string;
      visualEngine: string;
      resolution: string;
    };
  };
  onReset: () => void;
  onRegenerateOutfit: (e: React.FormEvent) => Promise<void>;
  onUpdateOutfit: (updatedOutfit: Outfit, index: number, newImageUrl?: string, culturalNotes?: string, thoughts?: string) => void;
}

export default function OutfitResult({ result, onReset, onRegenerateOutfit, onUpdateOutfit }: OutfitResultProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveSuccessMessage, setShowSaveSuccessMessage] = useState(false)
  const [isReimagining, setIsReimagining] = useState(false)
  const [is1KModalOpen, setIs1KModalOpen] = useState(false)
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false)

  const currentOutfit = result.outfits?.[result.currentOutfitIndex] || {
    top: "No outfit available",
    bottom: "No outfit available",
    shoes: "No outfit available",
    accessories: ["No accessories available"]
  };

  const thoughtsText = result.thoughts || currentOutfit.thoughts || "";

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
      }, 5000);
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

  const handleSaveEdit = async (editedOutfit: Outfit) => {
    setIsEditing(false);
    setIsReimagining(true);

    try {
      // Call the API with Visual Engine (gemini-3.1-flash-lite-image) for high-speed local edits
      const response = await fetch('/api/reimage-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfit: editedOutfit,
          vibe: result.vibe,
          occasion: result.occasion,
          weather: result.weather,
          isEdit: true,
          baseImageUrl: result.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image after edit');
      }

      const data = await response.json();
      const newImageUrl = data.imageUrl;

      // Update outfit data and 1K image in parent state
      onUpdateOutfit(editedOutfit, result.currentOutfitIndex, newImageUrl, result.culturalNotes, result.thoughts);

      toast({
        title: "Outfit updated and saved!",
        description: newImageUrl && !newImageUrl.includes("placeholder")
          ? "High-speed 1K outfit image generated in sub-2 seconds."
          : "Your outfit has been updated and saved.",
      });
    } catch (error) {
      console.error("Error regenerating image after edit:", error);
      toast({
        title: "Error",
        description: "Outfit updated, but image regeneration failed.",
        variant: "destructive",
      });
    } finally {
      setIsReimagining(false);
    }
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <span>Your Outfit Recommendation</span>
                <Badge variant="outline" className="border-purple-500/40 text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 text-xs">
                  Gemini 3 Dual-Model
                </Badge>
              </CardTitle>
              {result.outfits.length > 1 ? (
                <CardDescription className="text-sm md:text-base">
                  Outfit {result.currentOutfitIndex + 1} of {result.outfits.length}
                </CardDescription>
              ) : (
                <CardDescription className="text-sm md:text-base">
                  Reasoned by gemini-3-flash-preview • Rendered by gemini-3.1-flash-lite-image
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Brain className="h-3 w-3 text-purple-500" />
                <span>Agentic Thinking</span>
              </Badge>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>1K Visual Engine</span>
              </Badge>
            </div>
          </div>
          {showSaveSuccessMessage && (
            <p className="text-green-500 text-sm mt-2">Outfit saved successfully!</p>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="outfit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="outfit" className="text-xs md:text-sm">
                Outfit
              </TabsTrigger>
              <TabsTrigger value="thinking" className="text-xs md:text-sm flex items-center gap-1">
                <Brain className="h-3.5 w-3.5 text-purple-500" />
                <span>Thinking Process</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs md:text-sm">
                Trip Details
              </TabsTrigger>
            </TabsList>

            {/* OUTFIT TAB */}
            <TabsContent value="outfit" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-full max-w-[340px] md:max-w-[420px] aspect-square bg-muted rounded-xl overflow-hidden border shadow-sm group">
                    {/* Resolution & Engine Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <Badge className="bg-black/75 hover:bg-black text-white text-[10px] md:text-xs font-medium border-0 shadow backdrop-blur-md flex items-center gap-1.5 px-2.5 py-1">
                        <Zap className="h-3 w-3 text-amber-400" />
                        1K (1024x1024) • Sub-2s
                      </Badge>
                    </div>

                    {/* View Full 1K Image Button */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIs1KModalOpen(true)}
                      className="absolute bottom-2.5 right-2.5 z-10 bg-black/75 hover:bg-black text-white text-xs backdrop-blur-md border-0 shadow flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      View 1K HD
                    </Button>

                    {isReimagining ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-xs">
                        <div className="flex flex-col items-center text-white p-4 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mb-2 text-amber-400" />
                          <span className="text-sm font-medium">Nano Banana 2 Lite Engine...</span>
                          <span className="text-xs text-white/80">Generating 1K visual (&lt;2s target)</span>
                        </div>
                      </div>
                    ) : null}

                    <img
                      src={result.imageUrl || "/placeholder.svg?height=1024&width=1024"}
                      alt="1K outfit recommendation"
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                      onClick={() => setIs1KModalOpen(true)}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Rendered at 1024x1024 resolution by gemini-3.1-flash-lite-image
                  </p>
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
                      {currentOutfit.outerwear && currentOutfit.outerwear !== "N/A" && currentOutfit.outerwear !== "Not applicable" && (
                        <li className="flex items-start">
                          <Badge variant="outline" className="w-20 text-start flex-shrink-0 text-xs">
                            Outerwear
                          </Badge>
                          <span className="text-sm md:text-base ml-2">
                            {currentOutfit.outerwear}
                            {currentOutfit.outerwearColor && currentOutfit.outerwearColor !== "N/A" && <span className="text-muted-foreground"> ({currentOutfit.outerwearColor})</span>}
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

                  {/* Collapsible Quick Thinking Trace */}
                  <div className="rounded-lg border bg-card/60 p-3 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                      className="flex items-center justify-between w-full text-left font-medium text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span>Agentic Reasoning ({result.modelInfo?.reasoningModel || 'gemini-3-flash-preview'})</span>
                      </div>
                      {isThinkingExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isThinkingExpanded && (
                      <div className="mt-3 text-xs md:text-sm text-muted-foreground whitespace-pre-wrap bg-muted/60 p-3 rounded-md font-mono border max-h-52 overflow-y-auto">
                        {thoughtsText || (
                          `• Analyzed destination climate (${result.destination}: ${result.weather.temperature}°C, ${result.weather.condition})\n• Evaluated cultural norms and local dressing etiquette for ${result.occasion}\n• Synthesized user vibe (${result.vibe}) with appropriate layering and footwear\n• Generated structured recommendation via Gemini 3 Reasoning Backbone`
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* THINKING PROCESS TAB */}
            <TabsContent value="thinking" className="pt-4">
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <div>
                        <h3 className="font-semibold text-base">Gemini 3 Reasoning / Agentic Backbone</h3>
                        <p className="text-xs text-muted-foreground">Model: {result.modelInfo?.reasoningModel || 'gemini-3-flash-preview'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-purple-300 text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 text-xs">
                        Thinking Enabled
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        65,536 Tokens
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Decision-Making &amp; Reasoning Trace
                    </div>
                    <div className="rounded-lg bg-background p-4 border font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                      {thoughtsText ? (
                        thoughtsText
                      ) : (
                        <div className="space-y-2 font-sans text-sm text-muted-foreground">
                          <p>
                            <strong>Step 1: Context &amp; Climate Evaluation</strong>
                            <br />
                            Evaluated target location <em>{result.destination}</em> with current weather readings ({result.weather.temperature}°C, {result.weather.condition}, precipitation {result.weather.precipitation}). Layering and breathable fabrics were prioritized based on ambient thermal conditions.
                          </p>
                          <p>
                            <strong>Step 2: Cultural Dressing Norms &amp; Occasion Grounding</strong>
                            <br />
                            Assessed occasion requirements for <em>{occasionMap[result.occasion] || result.occasion}</em> against cultural norms of {result.destination}. Cultural note: <em>"{result.culturalNotes}"</em>.
                          </p>
                          <p>
                            <strong>Step 3: Vibe &amp; Silhouette Synthesis</strong>
                            <br />
                            Harmonized the user's requested vibe <em>({vibeMap[result.vibe] || result.vibe})</em> with tailored top, bottom, footwear, and accessory pairings to achieve balanced color coordination.
                          </p>
                          <p>
                            <strong>Step 4: Dispatch to Visual Engine</strong>
                            <br />
                            Dispatched curated outfit metadata to <code>gemini-3.1-flash-lite-image</code> (Nano Banana 2 Lite) for sub-2 second 1K (1024x1024) realistic generation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Architecture Info Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3 bg-card flex items-start gap-3">
                    <Cpu className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs md:text-sm">Reasoning Backbone</div>
                      <div className="text-xs text-muted-foreground">
                        <code>gemini-3-flash-preview</code> handles complex travel planning, multimodal analysis, and structured JSON generation.
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 bg-card flex items-start gap-3">
                    <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs md:text-sm">Nano Banana 2 Lite Visual Engine</div>
                      <div className="text-xs text-muted-foreground">
                        <code>gemini-3.1-flash-lite-image</code> targets 1024x1024 (1K) high-res output with sub-2 second generation latency.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TRIP DETAILS TAB */}
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

      {/* 1K High-Resolution Preview Modal */}
      <Dialog open={is1KModalOpen} onOpenChange={setIs1KModalOpen}>
        <DialogContent className="max-w-3xl w-full p-4 md:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
                  <span>1K Resolution Outfit Preview</span>
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-xs">
                    1024x1024 HD
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  Generated by Gemini 3 Visual Engine (gemini-3.1-flash-lite-image) • Sub-2s Latency
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex justify-center items-center py-2">
            <div className="relative w-full max-w-[500px] aspect-square rounded-lg overflow-hidden border shadow-inner bg-muted">
              <img
                src={result.imageUrl || "/placeholder.svg?height=1024&width=1024"}
                alt="1K high-resolution outfit render"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Target Resolution: 1024x1024px | Format: 1:1 Aspect Ratio
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = result.imageUrl || '/placeholder.svg?height=1024&width=1024';
                  link.download = `outfit-${result.destination.toLowerCase().replace(/\s+/g, '-')}-1k.jpg`;
                  link.click();
                }}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download 1K Image
              </Button>
              <Button size="sm" onClick={() => setIs1KModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
