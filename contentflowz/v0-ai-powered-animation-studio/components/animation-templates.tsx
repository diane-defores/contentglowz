"use client"

import type React from "react"

import { useState } from "react"
import { useAnimation, type AnimationLayer } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Play, RotateCw, MoveRight, Eye, Heart, Sparkles, Waves, TrendingUp, Library } from "lucide-react"
import { toast } from "sonner"

interface AnimationTemplate {
  id: string
  name: string
  description: string
  category: "entrance" | "emphasis" | "exit" | "motion" | "special"
  icon: React.ComponentType<{ className?: string }>
  preview: string
  duration: number
  layers: Omit<AnimationLayer, "id">[]
}

const animationTemplates: AnimationTemplate[] = [
  {
    id: "bouncing-ball",
    name: "Bouncing Ball",
    description: "Classic bouncing ball with realistic physics",
    category: "motion",
    icon: Play,
    preview: "A red ball bounces up and down with easing",
    duration: 3,
    layers: [
      {
        name: "Bouncing Ball",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: 150, y: 300, width: 60, height: 60, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { y: 300, scaleY: 1 }, easing: "ease-out" },
          { id: "kf2", time: 0.5, properties: { y: 100, scaleY: 1.1 }, easing: "ease-in" },
          { id: "kf3", time: 1, properties: { y: 300, scaleY: 0.8 }, easing: "ease-out" },
          { id: "kf4", time: 1.5, properties: { y: 150, scaleY: 1.05 }, easing: "ease-in" },
          { id: "kf5", time: 2, properties: { y: 300, scaleY: 0.9 }, easing: "ease-out" },
          { id: "kf6", time: 2.5, properties: { y: 200, scaleY: 1 }, easing: "ease-in" },
          { id: "kf7", time: 3, properties: { y: 300, scaleY: 1 }, easing: "ease-out" },
        ],
        content: { shape: "circle", fill: "#ef4444" },
      },
    ],
  },
  {
    id: "fade-in-text",
    name: "Fade In Text",
    description: "Smooth text fade-in with slight scale",
    category: "entrance",
    icon: Eye,
    preview: "Text fades in smoothly from transparent",
    duration: 2,
    layers: [
      {
        name: "Fade In Text",
        type: "text",
        visible: true,
        locked: false,
        properties: { x: 100, y: 200, width: 300, height: 50, rotation: 0, opacity: 0, scaleX: 0.8, scaleY: 0.8 },
        keyframes: [
          { id: "kf1", time: 0, properties: { opacity: 0, scaleX: 0.8, scaleY: 0.8 }, easing: "ease-out" },
          { id: "kf2", time: 2, properties: { opacity: 1, scaleX: 1, scaleY: 1 }, easing: "ease-out" },
        ],
        content: { text: "Hello World!", color: "#1f2937", fontSize: 32, fontFamily: "Arial" },
      },
    ],
  },
  {
    id: "slide-in-left",
    name: "Slide In Left",
    description: "Element slides in from the left side",
    category: "entrance",
    icon: MoveRight,
    preview: "Rectangle slides in from left with bounce",
    duration: 1.5,
    layers: [
      {
        name: "Slide Rectangle",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: -150, y: 200, width: 120, height: 80, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { x: -150 }, easing: "ease-out" },
          { id: "kf2", time: 1, properties: { x: 180 }, easing: "ease-in-out" },
          { id: "kf3", time: 1.5, properties: { x: 150 }, easing: "ease-out" },
        ],
        content: { shape: "rectangle", fill: "#3b82f6" },
      },
    ],
  },
  {
    id: "spin-and-scale",
    name: "Spin & Scale",
    description: "Element spins while scaling up",
    category: "emphasis",
    icon: RotateCw,
    preview: "Circle spins 360° while growing larger",
    duration: 2,
    layers: [
      {
        name: "Spinning Circle",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: 200, y: 200, width: 80, height: 80, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { rotation: 0, scaleX: 1, scaleY: 1 }, easing: "linear" },
          { id: "kf2", time: 2, properties: { rotation: 360, scaleX: 1.5, scaleY: 1.5 }, easing: "linear" },
        ],
        content: { shape: "circle", fill: "#10b981" },
      },
    ],
  },
  {
    id: "pulse-effect",
    name: "Pulse Effect",
    description: "Rhythmic pulsing animation",
    category: "emphasis",
    icon: Heart,
    preview: "Element pulses with scale and opacity",
    duration: 2,
    layers: [
      {
        name: "Pulsing Heart",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: 200, y: 200, width: 100, height: 100, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { scaleX: 1, scaleY: 1, opacity: 1 }, easing: "ease-in-out" },
          { id: "kf2", time: 0.5, properties: { scaleX: 1.2, scaleY: 1.2, opacity: 0.8 }, easing: "ease-in-out" },
          { id: "kf3", time: 1, properties: { scaleX: 1, scaleY: 1, opacity: 1 }, easing: "ease-in-out" },
          { id: "kf4", time: 1.5, properties: { scaleX: 1.2, scaleY: 1.2, opacity: 0.8 }, easing: "ease-in-out" },
          { id: "kf5", time: 2, properties: { scaleX: 1, scaleY: 1, opacity: 1 }, easing: "ease-in-out" },
        ],
        content: { shape: "circle", fill: "#ec4899" },
      },
    ],
  },
  {
    id: "wave-motion",
    name: "Wave Motion",
    description: "Smooth wave-like movement",
    category: "motion",
    icon: Waves,
    preview: "Element moves in a sine wave pattern",
    duration: 4,
    layers: [
      {
        name: "Wave Element",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: 50, y: 250, width: 40, height: 40, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { x: 50, y: 250 }, easing: "ease-in-out" },
          { id: "kf2", time: 1, properties: { x: 200, y: 150 }, easing: "ease-in-out" },
          { id: "kf3", time: 2, properties: { x: 350, y: 250 }, easing: "ease-in-out" },
          { id: "kf4", time: 3, properties: { x: 500, y: 150 }, easing: "ease-in-out" },
          { id: "kf5", time: 4, properties: { x: 650, y: 250 }, easing: "ease-in-out" },
        ],
        content: { shape: "circle", fill: "#06b6d4" },
      },
    ],
  },
  {
    id: "zoom-out-exit",
    name: "Zoom Out Exit",
    description: "Element scales down and fades out",
    category: "exit",
    icon: TrendingUp,
    preview: "Element shrinks and disappears",
    duration: 1.5,
    layers: [
      {
        name: "Zoom Out Element",
        type: "shape",
        visible: true,
        locked: false,
        properties: { x: 200, y: 200, width: 120, height: 120, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { scaleX: 1, scaleY: 1, opacity: 1 }, easing: "ease-in" },
          { id: "kf2", time: 1.5, properties: { scaleX: 0, scaleY: 0, opacity: 0 }, easing: "ease-in" },
        ],
        content: { shape: "rectangle", fill: "#f59e0b" },
      },
    ],
  },
  {
    id: "typewriter-text",
    name: "Typewriter Effect",
    description: "Text appears character by character",
    category: "special",
    icon: Sparkles,
    preview: "Text types out with cursor effect",
    duration: 3,
    layers: [
      {
        name: "Typewriter Text",
        type: "text",
        visible: true,
        locked: false,
        properties: { x: 100, y: 200, width: 400, height: 60, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        keyframes: [
          { id: "kf1", time: 0, properties: { opacity: 0 }, easing: "linear" },
          { id: "kf2", time: 0.5, properties: { opacity: 1 }, easing: "linear" },
        ],
        content: { text: "Typing animation...", color: "#374151", fontSize: 24, fontFamily: "Arial" },
      },
    ],
  },
]

export function AnimationTemplates() {
  const { dispatch } = useAnimation()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = [
    { id: "all", name: "All", count: animationTemplates.length },
    { id: "entrance", name: "Entrance", count: animationTemplates.filter((t) => t.category === "entrance").length },
    { id: "emphasis", name: "Emphasis", count: animationTemplates.filter((t) => t.category === "emphasis").length },
    { id: "motion", name: "Motion", count: animationTemplates.filter((t) => t.category === "motion").length },
    { id: "exit", name: "Exit", count: animationTemplates.filter((t) => t.category === "exit").length },
    { id: "special", name: "Special", count: animationTemplates.filter((t) => t.category === "special").length },
  ]

  const filteredTemplates =
    selectedCategory === "all" ? animationTemplates : animationTemplates.filter((t) => t.category === selectedCategory)

  const applyTemplate = (template: AnimationTemplate) => {
    template.layers.forEach((layerTemplate) => {
      const newLayer: AnimationLayer = {
        ...layerTemplate,
        id: `layer_${Date.now()}_${Math.random()}`,
        keyframes: layerTemplate.keyframes.map((kf) => ({
          ...kf,
          id: `kf_${Date.now()}_${Math.random()}`,
        })),
      }

      dispatch({ type: "ADD_LAYER", layer: newLayer })
    })

    toast.success(`Applied "${template.name}" template`, {
      description: `Added ${template.layers.length} layer${template.layers.length > 1 ? "s" : ""} with ${template.duration}s animation`,
      duration: 3000,
    })

    // Set timeline duration to match template
    // This would require adding a SET_DURATION action to the reducer
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "entrance":
        return "bg-green-100 text-green-800"
      case "emphasis":
        return "bg-blue-100 text-blue-800"
      case "motion":
        return "bg-purple-100 text-purple-800"
      case "exit":
        return "bg-red-100 text-red-800"
      case "special":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Library className="w-4 h-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Animation Templates
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[60vh]">
          {/* Categories Sidebar */}
          <div className="w-48 border-r pr-4">
            <h4 className="text-sm font-medium mb-3">Categories</h4>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <template.icon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                        <Badge className={`text-xs ${getCategoryColor(template.category)}`}>{template.category}</Badge>
                      </div>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground mb-3">{template.preview}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{template.duration}s duration</span>
                        <Button size="sm" onClick={() => applyTemplate(template)}>
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
