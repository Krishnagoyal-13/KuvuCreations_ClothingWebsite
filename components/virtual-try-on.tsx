"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ShirtIcon as Tshirt } from "lucide-react"

// Mock model data
const models = [
  {
    id: "model1",
    name: "Model 1",
    height: "5'4\" (163cm)",
    size: "XS",
    image: "/placeholder.svg?height=600&width=400&text=Model+1",
  },
  {
    id: "model2",
    name: "Model 2",
    height: "5'7\" (170cm)",
    size: "S",
    image: "/placeholder.svg?height=600&width=400&text=Model+2",
  },
  {
    id: "model3",
    name: "Model 3",
    height: "5'9\" (175cm)",
    size: "M",
    image: "/placeholder.svg?height=600&width=400&text=Model+3",
  },
  {
    id: "model4",
    name: "Model 4",
    height: "5'11\" (180cm)",
    size: "L",
    image: "/placeholder.svg?height=600&width=400&text=Model+4",
  },
]

interface VirtualTryOnProps {
  productImage: string
  productName: string
}

export default function VirtualTryOn({ productImage, productName }: VirtualTryOnProps) {
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [zoom, setZoom] = useState([50])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-rose-500 border-rose-200 hover:bg-rose-50">
          <Tshirt className="h-4 w-4 mr-2" />
          Virtual Try-On
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
          <DialogDescription>See how {productName} looks on different body types</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2 relative aspect-[3/4] rounded-lg overflow-hidden border">
            <Image
              src={selectedModel.image || "/placeholder.svg"}
              alt={selectedModel.name}
              fill
              className="object-cover"
              style={{ objectPosition: `center ${100 - zoom[0]}%` }}
            />

            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Zoom</span>
                <span className="text-sm">{zoom[0]}%</span>
              </div>
              <Slider value={zoom} onValueChange={setZoom} max={100} step={1} className="[&>span]:bg-white" />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Choose a Model</h3>
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedModel.id === model.id ? "bg-rose-50 border border-rose-200" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <div className="relative h-16 w-12 rounded overflow-hidden">
                    <Image src={model.image || "/placeholder.svg"} alt={model.name} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Height: {model.height} • Size: {model.size}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">About This Feature</h4>
              <p className="text-sm text-muted-foreground">
                Our virtual try-on feature helps you visualize how this item might look on different body types. Please
                note that actual fit may vary.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
