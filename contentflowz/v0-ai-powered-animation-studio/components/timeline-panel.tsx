"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAnimation, type AnimationLayer, type Keyframe } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function TimelinePanel() {
  const { state, dispatch } = useAnimation()
  const [timelineZoom, setTimelineZoom] = useState(50) // pixels per second
  const [timelineScroll, setTimelineScroll] = useState(0)
  const [draggedKeyframe, setDraggedKeyframe] = useState<{ layerId: string; keyframeId: string } | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isCreatingKeyframe, setIsCreatingKeyframe] = useState<string | null>(null)

  const togglePlayback = () => {
    dispatch({ type: "SET_PLAYING", playing: !state.isPlaying })
  }

  const stopPlayback = () => {
    dispatch({ type: "SET_PLAYING", playing: false })
    dispatch({ type: "SET_CURRENT_TIME", time: 0 })
  }

  const jumpToStart = () => {
    dispatch({ type: "SET_CURRENT_TIME", time: 0 })
  }

  const jumpToEnd = () => {
    dispatch({ type: "SET_CURRENT_TIME", time: state.duration })
  }

  // Convert time to pixel position
  const timeToPixel = (time: number) => {
    return time * timelineZoom - timelineScroll
  }

  // Convert pixel position to time
  const pixelToTime = (pixel: number) => {
    return (pixel + timelineScroll) / timelineZoom
  }

  // Handle timeline click to set current time
  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left - 200 // Account for layer names width
    const time = pixelToTime(x)
    dispatch({ type: "SET_CURRENT_TIME", time: Math.max(0, Math.min(time, state.duration)) })
  }

  // Add keyframe at current time
  const addKeyframe = (layerId: string, time?: number) => {
    const layer = state.layers.find((l) => l.id === layerId)
    if (!layer) return

    const keyframeTime = time ?? state.currentTime
    const newKeyframe: Keyframe = {
      id: `kf_${Date.now()}`,
      time: keyframeTime,
      properties: { ...layer.properties },
      easing: "ease-in-out",
    }

    dispatch({ type: "ADD_KEYFRAME", layerId, keyframe: newKeyframe })
  }

  // Delete keyframe
  const deleteKeyframe = (layerId: string, keyframeId: string) => {
    dispatch({ type: "DELETE_KEYFRAME", layerId, keyframeId })
  }

  // Handle keyframe drag
  const handleKeyframeDrag = (e: React.MouseEvent, layerId: string, keyframeId: string) => {
    e.stopPropagation()
    setDraggedKeyframe({ layerId, keyframeId })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left - 200
      const newTime = Math.max(0, Math.min(pixelToTime(x), state.duration))

      dispatch({
        type: "UPDATE_KEYFRAME",
        layerId,
        keyframeId,
        updates: { time: newTime },
      })
    }

    const handleMouseUp = () => {
      setDraggedKeyframe(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Generate time ruler marks
  const generateTimeMarks = () => {
    const marks = []
    const step = timelineZoom > 100 ? 0.1 : timelineZoom > 50 ? 0.5 : 1

    for (let time = 0; time <= state.duration; time += step) {
      const x = timeToPixel(time)
      if (x >= -50 && x <= 1000) {
        // Only render visible marks
        marks.push(
          <div key={time} className="absolute top-0 h-full border-l border-border/30" style={{ left: x }}>
            {time % 1 === 0 && (
              <div className="absolute top-1 text-xs text-muted-foreground whitespace-nowrap">{time}s</div>
            )}
          </div>,
        )
      }
    }
    return marks
  }

  // Render layer track
  const renderLayerTrack = (layer: AnimationLayer) => {
    return (
      <div key={layer.id} className="flex border-b border-border/50">
        {/* Layer Info */}
        <div className="w-40 p-1 border-r border-border bg-muted/20 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0"
            onClick={() => dispatch({ type: "UPDATE_LAYER", id: layer.id, updates: { visible: !layer.visible } })}
          >
            {layer.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0"
            onClick={() => dispatch({ type: "UPDATE_LAYER", id: layer.id, updates: { locked: !layer.locked } })}
          >
            {layer.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
          </Button>

          <span className="text-xs truncate flex-1" title={layer.name}>
            {layer.name}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0"
            onClick={() => addKeyframe(layer.id)}
            title="Add keyframe"
          >
            <Plus className="w-2.5 h-2.5" />
          </Button>
        </div>

        {/* Timeline Track */}
        <div className="flex-1 relative h-6 bg-background hover:bg-muted/10">
          {/* Keyframes */}
          {layer.keyframes.map((keyframe) => {
            const x = timeToPixel(keyframe.time)
            if (x < -20 || x > 1000) return null

            return (
              <div
                key={keyframe.id}
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-primary rounded cursor-move flex items-center justify-center",
                  "hover:bg-primary/80 transition-colors",
                  draggedKeyframe?.keyframeId === keyframe.id && "ring-2 ring-primary/50",
                )}
                style={{ left: x - 10 }}
                onMouseDown={(e) => handleKeyframeDrag(e, layer.id, keyframe.id)}
                onDoubleClick={() => deleteKeyframe(layer.id, keyframe.id)}
                title={`${keyframe.time.toFixed(2)}s`}
              >
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              </div>
            )
          })}

          {/* Click to add keyframe */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const time = pixelToTime(x)
              addKeyframe(layer.id, Math.max(0, Math.min(time, state.duration)))
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Timeline Header */}
      <div className="p-1.5 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={jumpToStart}>
              <SkipBack className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={togglePlayback}>
              {state.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={stopPlayback}>
              <Square className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={jumpToEnd}>
              <SkipForward className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex-1 mx-2">
            <Slider
              value={[state.currentTime]}
              max={state.duration}
              step={0.01}
              onValueChange={([value]) => dispatch({ type: "SET_CURRENT_TIME", time: value })}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{state.currentTime.toFixed(1)}s</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setTimelineZoom(Math.max(10, timelineZoom - 10))}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setTimelineZoom(Math.min(200, timelineZoom + 10))}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        <div ref={timelineRef} className="h-full overflow-auto">
          {/* Time Ruler */}
          <div className="flex border-b border-border">
            <div className="w-40 p-1 border-r border-border bg-muted/20 text-xs font-medium">Layers</div>
            <div className="flex-1 relative h-6 bg-muted/10" onClick={handleTimelineClick}>
              {generateTimeMarks()}

              {/* Current Time Indicator */}
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500 z-10 pointer-events-none"
                style={{ left: timeToPixel(state.currentTime) }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rotate-45 transform origin-center" />
              </div>
            </div>
          </div>

          {/* Layer Tracks */}
          <div className="min-h-0">
            {state.layers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-xs">
                No layers to animate. Create layers first using the AI assistant.
              </div>
            ) : (
              state.layers.map(renderLayerTrack)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
