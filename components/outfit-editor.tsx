"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, XCircle } from "lucide-react"

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
  const [editedOutfit, setEditedOutfit] = useState({ ...outfit })
  const [newAccessory, setNewAccessory] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditedOutfit((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddAccessory = () => {
    if (newAccessory.trim()) {
      setEditedOutfit((prev) => ({
        ...prev,
        accessories: [...prev.accessories, newAccessory.trim()],
      }))
      setNewAccessory("")
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Your Outfit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="top">Top</Label>
            <Input id="top" name="top" value={editedOutfit.top} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bottom">Bottom</Label>
            <Input id="bottom" name="bottom" value={editedOutfit.bottom} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shoes">Shoes</Label>
            <Input id="shoes" name="shoes" value={editedOutfit.shoes} onChange={handleChange} />
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
            <Label>Accessories</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedOutfit.accessories.map((accessory, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1.5">
                  {accessory}
                  <button
                    type="button"
                    onClick={() => handleRemoveAccessory(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {accessory}</span>
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAccessory}
                onChange={(e) => setNewAccessory(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add accessory"
              />
              <Button type="button" size="icon" onClick={handleAddAccessory} disabled={!newAccessory.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={() => onSave(editedOutfit)}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
