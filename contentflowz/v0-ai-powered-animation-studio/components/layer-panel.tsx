"use client"

import { useState } from "react"
import { useAnimation, type AnimationLayer } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Folder,
  FolderOpen,
  Square,
  Circle,
  Type,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function LayerPanel() {
  const { state, dispatch } = useAnimation()
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)
  const [editingLayer, setEditingLayer] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Create new layer
  const createLayer = (type: "rectangle" | "circle" | "text" | "group") => {
    const newLayer: AnimationLayer = {
      id: `layer_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${state.layers.length + 1}`,
      type: type === "group" ? "group" : "shape",
      visible: true,
      locked: false,
      properties: {
        x: 100,
        y: 100,
        width: type === "text" ? 200 : 100,
        height: type === "text" ? 50 : 100,
        rotation: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
      },
      keyframes: [],
      content:
        type === "group"
          ? undefined
          : {
              shape: type === "text" ? undefined : type,
              text: type === "text" ? "Sample Text" : undefined,
              fill: type === "text" ? "#000000" : "#3b82f6",
              fontSize: type === "text" ? 16 : undefined,
              fontFamily: type === "text" ? "Arial" : undefined,
            },
      children: type === "group" ? [] : undefined,
    }

    dispatch({ type: "ADD_LAYER", layer: newLayer })
  }

  // Delete layer
  const deleteLayer = (layerId: string) => {
    dispatch({ type: "DELETE_LAYER", id: layerId })
  }

  // Duplicate layer
  const duplicateLayer = (layer: AnimationLayer) => {
    const duplicatedLayer: AnimationLayer = {
      ...layer,
      id: `layer_${Date.now()}`,
      name: `${layer.name} Copy`,
      properties: { ...layer.properties, x: layer.properties.x + 20, y: layer.properties.y + 20 },
      keyframes: layer.keyframes.map((kf) => ({ ...kf, id: `kf_${Date.now()}_${Math.random()}` })),
      content: layer.content ? { ...layer.content } : undefined,
      children: layer.children ? [...layer.children] : undefined,
    }

    dispatch({ type: "ADD_LAYER", layer: duplicatedLayer })
  }

  // Toggle layer visibility
  const toggleVisibility = (layerId: string) => {
    const layer = state.layers.find((l) => l.id === layerId)
    if (layer) {
      dispatch({ type: "UPDATE_LAYER", id: layerId, updates: { visible: !layer.visible } })
    }
  }

  // Toggle layer lock
  const toggleLock = (layerId: string) => {
    const layer = state.layers.find((l) => l.id === layerId)
    if (layer) {
      dispatch({ type: "UPDATE_LAYER", id: layerId, updates: { locked: !layer.locked } })
    }
  }

  // Rename layer
  const renameLayer = (layerId: string, newName: string) => {
    dispatch({ type: "UPDATE_LAYER", id: layerId, updates: { name: newName } })
    setEditingLayer(null)
  }

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Get layer icon
  const getLayerIcon = (layer: AnimationLayer) => {
    if (layer.type === "group") {
      return expandedGroups.has(layer.id) ? FolderOpen : Folder
    }
    if (layer.content?.shape === "rectangle") return Square
    if (layer.content?.shape === "circle") return Circle
    if (layer.type === "text") return Type
    return Square
  }

  // Get root layers (layers without parents)
  const getRootLayers = () => {
    return state.layers.filter((layer) => !layer.parentId)
  }

  // Get child layers
  const getChildLayers = (parentId: string) => {
    return state.layers.filter((layer) => layer.parentId === parentId)
  }

  // Render layer item
  const renderLayerItem = (layer: AnimationLayer, depth = 0) => {
    const Icon = getLayerIcon(layer)
    const isSelected = state.selectedLayerIds.includes(layer.id)
    const isGroup = layer.type === "group"
    const isExpanded = expandedGroups.has(layer.id)
    const childLayers = isGroup ? getChildLayers(layer.id) : []

    return (
      <div key={layer.id}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 hover:bg-muted/50 cursor-pointer group text-xs",
            isSelected && "bg-primary/10 border-l-2 border-l-primary",
            dragOverLayer === layer.id && "bg-muted",
          )}
          style={{ paddingLeft: `${6 + depth * 12}px` }}
          onClick={() => dispatch({ type: "SELECT_LAYERS", ids: [layer.id] })}
          onDragStart={(e) => {
            setDraggedLayer(layer.id)
            e.dataTransfer.effectAllowed = "move"
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOverLayer(layer.id)
          }}
          onDragLeave={() => setDragOverLayer(null)}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedLayer && draggedLayer !== layer.id) {
              console.log(`Move ${draggedLayer} to ${layer.id}`)
            }
            setDraggedLayer(null)
            setDragOverLayer(null)
          }}
          draggable
        >
          {/* Expand/Collapse for groups */}
          {isGroup && (
            <Button
              variant="ghost"
              size="sm"
              className="w-3 h-3 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleGroupExpansion(layer.id)
              }}
            >
              {isExpanded ? <ChevronDown className="w-2 h-2" /> : <ChevronRight className="w-2 h-2" />}
            </Button>
          )}

          {/* Layer Icon */}
          <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />

          {/* Layer Name */}
          {editingLayer === layer.id ? (
            <Input
              defaultValue={layer.name}
              className="h-5 text-xs flex-1"
              autoFocus
              onBlur={(e) => renameLayer(layer.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameLayer(layer.id, e.currentTarget.value)
                } else if (e.key === "Escape") {
                  setEditingLayer(null)
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn("flex-1 text-xs truncate", !layer.visible && "opacity-50", layer.locked && "italic")}
              onDoubleClick={() => setEditingLayer(layer.id)}
            >
              {layer.name}
            </span>
          )}

          {/* Layer Controls */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="w-5 h-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleVisibility(layer.id)
              }}
            >
              {layer.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-5 h-5 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleLock(layer.id)
              }}
            >
              {layer.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-5 h-5 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-2.5 h-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateLayer(layer)}>
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingLayer(layer.id)}>Rename</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteLayer(layer.id)} className="text-destructive">
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Render child layers if group is expanded */}
        {isGroup && isExpanded && childLayers.map((childLayer) => renderLayerItem(childLayer, depth + 1))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-medium">Layers</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => createLayer("rectangle")}>
                <Square className="w-3 h-3 mr-2" />
                Rectangle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createLayer("circle")}>
                <Circle className="w-3 h-3 mr-2" />
                Circle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createLayer("text")}>
                <Type className="w-3 h-3 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => createLayer("group")}>
                <Folder className="w-3 h-3 mr-2" />
                Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {state.layers.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-xs">
            No layers yet. Create your first layer using the + button above.
          </div>
        ) : (
          <div className="py-0.5">{getRootLayers().map((layer) => renderLayerItem(layer))}</div>
        )}
      </div>

      {/* Layer Info */}
      {state.selectedLayerIds.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {state.selectedLayerIds.length} layer{state.selectedLayerIds.length > 1 ? "s" : ""} selected
          </div>
        </div>
      )}
    </div>
  )
}
