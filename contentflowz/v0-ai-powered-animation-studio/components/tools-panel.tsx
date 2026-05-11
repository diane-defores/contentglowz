"use client"
import { useAnimation } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { MousePointer, Square, Circle, Type, Pen, Move3D, Triangle, Minus, ArrowRight, Star } from "lucide-react"

export function ToolsPanel() {
  const { state, dispatch } = useAnimation()

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
    { id: "pen", icon: Pen, label: "Pen" },
  ] as const

  const selectedLayer =
    state.selectedLayerIds.length === 1 ? state.layers.find((l) => l.id === state.selectedLayerIds[0]) : null

  return (
    <div className="h-full flex flex-col bg-background text-xs">
      <div className="p-2 border-b border-border/50">
        <div className="grid grid-cols-5 gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={state.selectedTool === tool.id ? "default" : "ghost"}
              size="sm"
              className="h-8 p-0"
              onClick={() => dispatch({ type: "SET_TOOL", tool: tool.id })}
              title={tool.label}
            >
              <tool.icon className="w-3 h-3" />
            </Button>
          ))}
        </div>
      </div>

      {selectedLayer && (
        <div className="p-2 border-b border-border/50 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{selectedLayer.name}</div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-1">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={selectedLayer.properties.x}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LAYER_PROPERTIES",
                    layerId: selectedLayer.id,
                    properties: { x: Number.parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-6 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={selectedLayer.properties.y}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LAYER_PROPERTIES",
                    layerId: selectedLayer.id,
                    properties: { y: Number.parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-6 text-xs"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-1">
            <div>
              <Label className="text-xs">W</Label>
              <Input
                type="number"
                value={selectedLayer.properties.width}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LAYER_PROPERTIES",
                    layerId: selectedLayer.id,
                    properties: { width: Number.parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-6 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">H</Label>
              <Input
                type="number"
                value={selectedLayer.properties.height}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_LAYER_PROPERTIES",
                    layerId: selectedLayer.id,
                    properties: { height: Number.parseFloat(e.target.value) || 0 },
                  })
                }
                className="h-6 text-xs"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <Label className="text-xs">Opacity: {Math.round(selectedLayer.properties.opacity * 100)}%</Label>
            <Slider
              value={[selectedLayer.properties.opacity]}
              onValueChange={([value]) =>
                dispatch({
                  type: "UPDATE_LAYER_PROPERTIES",
                  layerId: selectedLayer.id,
                  properties: { opacity: value },
                })
              }
              min={0}
              max={1}
              step={0.01}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="p-2 border-b border-border/50">
        <div className="text-xs font-medium mb-2 text-muted-foreground">More Tools</div>
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="sm" className="h-8 p-0" title="Line">
            <Minus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 p-0" title="Arrow">
            <ArrowRight className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 p-0" title="Triangle">
            <Triangle className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 p-0" title="Star">
            <Star className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!selectedLayer && (
        <div className="p-3 text-center text-muted-foreground">
          <Move3D className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Select a layer to edit properties</p>
        </div>
      )}
    </div>
  )
}
