"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type OutfitEditorProps = {
  outfit: {
    top: string
    bottom: string
    shoes: string
    accessories: string[]
    outerwear?: string
  }
  onSave: (outfit: {
    top: string
    bottom: string
    shoes: string
    accessories: string[]
    outerwear?: string
  }) => void
  onCancel: () => void
}

export default function OutfitEditor({ outfit, onSave, onCancel }: OutfitEditorProps) {
  const { toast } = useToast()
  const [editedOutfit, setEditedOutfit] = useState({ ...outfit })
  const [newAccessory, setNewAccessory] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateOutfit = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!editedOutfit.top.trim()) {
      newErrors.top = "Top is required"
    }
    if (!editedOutfit.bottom.trim()) {
      newErrors.bottom = "Bottom is required"
    }
    if (!editedOutfit.shoes.trim()) {
      newErrors.shoes = "Shoes are required"
    }
    if (editedOutfit.accessories.length === 0) {
      newErrors.accessories = "At least one accessory is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditedOutfit((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleAddAccessory = () => {
    if (newAccessory.trim()) {
      setEditedOutfit((prev) => ({
        ...prev,
        accessories: [...prev.accessories, newAccessory.trim()],
      }))
      setNewAccessory("")
      // Clear accessories error if it exists
      if (errors.accessories) {
        setErrors((prev) => ({ ...prev, accessories: "" }))
      }
    }
  }

  const handleRemoveAccessory = (index: number) => {
    setEditedOutfit((prev) => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index),
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddAccessory()
    }
  }

  const handleSave = () => {
    if (validateOutfit()) {
      onSave(editedOutfit)
      toast({
        title: "Outfit updated",
        description: "Your outfit has been updated successfully",
      })
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Your Outfit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="top">Top *</Label>
            <Input 
              id="top" 
              name="top" 
              value={editedOutfit.top} 
              onChange={handleChange}
              className={errors.top ? "border-red-500" : ""}
            />
            {errors.top && <p className="text-sm text-red-500">{errors.top}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bottom">Bottom *</Label>
            <Input 
              id="bottom" 
              name="bottom" 
              value={editedOutfit.bottom} 
              onChange={handleChange}
              className={errors.bottom ? "border-red-500" : ""}
            />
            {errors.bottom && <p className="text-sm text-red-500">{errors.bottom}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shoes">Shoes *</Label>
            <Input 
              id="shoes" 
              name="shoes" 
              value={editedOutfit.shoes} 
              onChange={handleChange}
              className={errors.shoes ? "border-red-500" : ""}
            />
            {errors.shoes && <p className="text-sm text-red-500">{errors.shoes}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outerwear">Outerwear (Optional)</Label>
            <Input
              id="outerwear"
              name="outerwear"
              value={editedOutfit.outerwear || ""}
              onChange={handleChange}
              placeholder="e.g., Jacket, Coat, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessories">Accessories *</Label>
            <div className="flex gap-2">
              <Input
                id="accessories"
                value={newAccessory}
                onChange={(e) => setNewAccessory(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add an accessory"
                className={errors.accessories ? "border-red-500" : ""}
              />
              <Button type="button" onClick={handleAddAccessory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.accessories && <p className="text-sm text-red-500">{errors.accessories}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {editedOutfit.accessories.map((accessory, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {accessory}
                  <button
                    type="button"
                    onClick={() => handleRemoveAccessory(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
