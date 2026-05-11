"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { useAnimation } from "@/contexts/animation-context"

interface DragState {
  isDragging: boolean
  dragStart: { x: number; y: number }
  initialPosition: { x: number; y: number }
  selectedLayer: any
}

export function AnimationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, dispatch } = useAnimation()
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    initialPosition: { x: 0, y: 0 },
    selectedLayer: null,
  })

  // Animation loop
  useEffect(() => {
    if (!state.isPlaying) return

    const interval = setInterval(() => {
      dispatch({
        type: "SET_CURRENT_TIME",
        time: state.currentTime + 1 / state.fps,
      })
    }, 1000 / state.fps)

    return () => clearInterval(interval)
  }, [state.isPlaying, state.currentTime, state.fps, dispatch])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height)

    // Draw layers
    state.layers.forEach((layer) => {
      if (!layer.visible) return
      drawLayer(ctx, layer, state.currentTime)
    })

    // Draw selection handles
    state.selectedLayerIds.forEach((layerId) => {
      const layer = state.layers.find((l) => l.id === layerId)
      if (layer) {
        drawSelectionHandles(ctx, layer, state.currentTime)
      }
    })
  }, [state.layers, state.currentTime, state.selectedLayerIds])

  function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1

    const gridSize = 20

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  function drawLayer(ctx: CanvasRenderingContext2D, layer: any, currentTime: number) {
    ctx.save()

    // Get interpolated properties at current time
    const props = getInterpolatedProperties(layer, currentTime)

    // Apply transformations
    ctx.globalAlpha = props.opacity
    ctx.translate(props.x + props.width / 2, props.y + props.height / 2)
    ctx.rotate((props.rotation * Math.PI) / 180)
    ctx.scale(props.scaleX, props.scaleY)
    ctx.translate(-props.width / 2, -props.height / 2)

    // Draw based on layer type
    switch (layer.type) {
      case "shape":
        if (layer.content?.shape === "rectangle") {
          ctx.fillStyle = layer.content.fill || "#3b82f6"
          ctx.fillRect(0, 0, props.width, props.height)

          // Add subtle border
          ctx.strokeStyle = "rgba(0,0,0,0.1)"
          ctx.lineWidth = 1
          ctx.strokeRect(0, 0, props.width, props.height)
        } else if (layer.content?.shape === "circle") {
          ctx.fillStyle = layer.content.fill || "#3b82f6"
          ctx.beginPath()
          ctx.arc(props.width / 2, props.height / 2, Math.min(props.width, props.height) / 2, 0, 2 * Math.PI)
          ctx.fill()

          // Add subtle border
          ctx.strokeStyle = "rgba(0,0,0,0.1)"
          ctx.lineWidth = 1
          ctx.stroke()
        }
        break

      case "text":
        ctx.fillStyle = layer.content?.color || "#1f2937"
        ctx.font = `${layer.content?.fontSize || 16}px ${layer.content?.fontFamily || "Inter, sans-serif"}`
        ctx.textBaseline = "middle"
        ctx.fillText(layer.content?.text || "Text", 0, props.height / 2)
        break
    }

    ctx.restore()
  }

  function drawSelectionHandles(ctx: CanvasRenderingContext2D, layer: any, currentTime: number) {
    const props = getInterpolatedProperties(layer, currentTime)

    // Draw selection outline
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(props.x - 2, props.y - 2, props.width + 4, props.height + 4)
    ctx.setLineDash([])

    // Draw corner handles
    const handleSize = 8
    const handles = [
      { x: props.x - handleSize / 2, y: props.y - handleSize / 2 }, // top-left
      { x: props.x + props.width - handleSize / 2, y: props.y - handleSize / 2 }, // top-right
      { x: props.x - handleSize / 2, y: props.y + props.height - handleSize / 2 }, // bottom-left
      { x: props.x + props.width - handleSize / 2, y: props.y + props.height - handleSize / 2 }, // bottom-right
    ]

    handles.forEach((handle) => {
      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
  }

  function getInterpolatedProperties(layer: any, time: number) {
    if (layer.keyframes.length === 0) {
      return layer.properties
    }

    // Find surrounding keyframes
    const sortedKeyframes = [...layer.keyframes].sort((a, b) => a.time - b.time)

    let beforeKf = null
    let afterKf = null

    for (let i = 0; i < sortedKeyframes.length; i++) {
      if (sortedKeyframes[i].time <= time) {
        beforeKf = sortedKeyframes[i]
      }
      if (sortedKeyframes[i].time >= time && !afterKf) {
        afterKf = sortedKeyframes[i]
        break
      }
    }

    if (!beforeKf && !afterKf) {
      return layer.properties
    }

    if (!afterKf || beforeKf?.time === time) {
      return { ...layer.properties, ...beforeKf?.properties }
    }

    if (!beforeKf) {
      return { ...layer.properties, ...afterKf.properties }
    }

    // Interpolate between keyframes
    const t = (time - beforeKf.time) / (afterKf.time - beforeKf.time)
    const result = { ...layer.properties }

    Object.keys(afterKf.properties).forEach((key) => {
      const beforeVal = beforeKf.properties[key] ?? layer.properties[key]
      const afterVal = afterKf.properties[key]
      result[key] = beforeVal + (afterVal - beforeVal) * t
    })

    return result
  }

  function findLayerAtPoint(x: number, y: number) {
    // Check layers from top to bottom (reverse order)
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i]
      if (!layer.visible) continue

      const props = getInterpolatedProperties(layer, state.currentTime)
      if (x >= props.x && x <= props.x + props.width && y >= props.y && y <= props.y + props.height) {
        return layer
      }
    }
    return null
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if clicking on a layer
      const clickedLayer = findLayerAtPoint(x, y)

      if (clickedLayer) {
        dispatch({ type: "SELECT_LAYERS", ids: [clickedLayer.id] })

        const props = getInterpolatedProperties(clickedLayer, state.currentTime)
        setDragState({
          isDragging: true,
          dragStart: { x, y },
          initialPosition: { x: props.x, y: props.y },
          selectedLayer: clickedLayer,
        })
      } else {
        dispatch({ type: "SELECT_LAYERS", ids: [] })
        setDragState((prev) => ({ ...prev, isDragging: false, selectedLayer: null }))
      }
    },
    [state.layers, state.currentTime, dispatch],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || !dragState.selectedLayer) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const deltaX = x - dragState.dragStart.x
      const deltaY = y - dragState.dragStart.y

      const newX = dragState.initialPosition.x + deltaX
      const newY = dragState.initialPosition.y + deltaY

      // Update layer position
      dispatch({
        type: "UPDATE_LAYER_PROPERTIES",
        layerId: dragState.selectedLayer.id,
        properties: { x: newX, y: newY },
      })
    },
    [dragState, dispatch],
  )

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={state.canvasSize.width}
          height={state.canvasSize.height}
          className="border border-border/20 bg-white rounded-lg shadow-lg cursor-default"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Canvas Info */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
          {state.canvasSize.width} × {state.canvasSize.height}
        </div>
      </div>
    </div>
  )
}
