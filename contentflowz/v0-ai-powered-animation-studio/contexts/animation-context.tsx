"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"

// Animation Types
export interface AnimationLayer {
  id: string
  name: string
  type: "shape" | "text" | "group"
  visible: boolean
  locked: boolean
  parentId?: string
  children?: string[]
  properties: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
    opacity: number
    scaleX: number
    scaleY: number
  }
  keyframes: Keyframe[]
  content?: any // Shape data, text content, etc.
}

export interface Keyframe {
  id: string
  time: number
  properties: Partial<AnimationLayer["properties"]>
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out"
}

export interface AnimationState {
  layers: AnimationLayer[]
  selectedLayerIds: string[]
  currentTime: number
  duration: number
  isPlaying: boolean
  fps: number
  zoom: number
  canvasSize: { width: number; height: number }
  selectedTool: "select" | "rectangle" | "circle" | "text" | "pen"
}

// Actions
type AnimationAction =
  | { type: "ADD_LAYER"; layer: AnimationLayer }
  | { type: "UPDATE_LAYER"; id: string; updates: Partial<AnimationLayer> }
  | { type: "UPDATE_LAYER_PROPERTIES"; layerId: string; properties: Partial<AnimationLayer["properties"]> }
  | { type: "DELETE_LAYER"; id: string }
  | { type: "SELECT_LAYERS"; ids: string[] }
  | { type: "SET_CURRENT_TIME"; time: number }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SET_TOOL"; tool: AnimationState["selectedTool"] }
  | { type: "ADD_KEYFRAME"; layerId: string; keyframe: Keyframe }
  | { type: "UPDATE_KEYFRAME"; layerId: string; keyframeId: string; updates: Partial<Keyframe> }
  | { type: "DELETE_KEYFRAME"; layerId: string; keyframeId: string }

const initialState: AnimationState = {
  layers: [
    {
      id: "default_circle_1",
      name: "Welcome Circle",
      type: "shape",
      visible: true,
      locked: false,
      properties: { x: 150, y: 200, width: 80, height: 80, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
      keyframes: [
        { id: "kf1", time: 0, properties: { scaleX: 1, scaleY: 1, opacity: 0.8 }, easing: "ease-in-out" },
        { id: "kf2", time: 2, properties: { scaleX: 1.2, scaleY: 1.2, opacity: 1 }, easing: "ease-in-out" },
        { id: "kf3", time: 4, properties: { scaleX: 1, scaleY: 1, opacity: 0.8 }, easing: "ease-in-out" },
      ],
      content: { shape: "circle", fill: "#3b82f6" },
    },
    {
      id: "default_text_1",
      name: "Welcome Text",
      type: "text",
      visible: true,
      locked: false,
      properties: { x: 300, y: 180, width: 250, height: 50, rotation: 0, opacity: 0, scaleX: 0.8, scaleY: 0.8 },
      keyframes: [
        { id: "kf1", time: 0, properties: { opacity: 0, scaleX: 0.8, scaleY: 0.8 }, easing: "ease-out" },
        { id: "kf2", time: 1.5, properties: { opacity: 1, scaleX: 1, scaleY: 1 }, easing: "ease-out" },
      ],
      content: { text: "Animation Studio", color: "#1f2937", fontSize: 28, fontFamily: "Montserrat" },
    },
    {
      id: "default_rect_1",
      name: "Sliding Rectangle",
      type: "shape",
      visible: true,
      locked: false,
      properties: { x: -100, y: 320, width: 120, height: 60, rotation: 0, opacity: 1, scaleX: 1, scaleY: 1 },
      keyframes: [
        { id: "kf1", time: 0, properties: { x: -100 }, easing: "ease-out" },
        { id: "kf2", time: 2.5, properties: { x: 200 }, easing: "ease-in-out" },
        { id: "kf3", time: 5, properties: { x: 500 }, easing: "ease-in" },
      ],
      content: { shape: "rectangle", fill: "#10b981" },
    },
  ],
  selectedLayerIds: [],
  currentTime: 0,
  duration: 10, // 10 seconds
  isPlaying: false,
  fps: 30,
  zoom: 1,
  canvasSize: { width: 800, height: 600 },
  selectedTool: "select",
}

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case "ADD_LAYER":
      return {
        ...state,
        layers: [...state.layers, action.layer],
      }

    case "UPDATE_LAYER":
      return {
        ...state,
        layers: state.layers.map((layer) => (layer.id === action.id ? { ...layer, ...action.updates } : layer)),
      }

    case "UPDATE_LAYER_PROPERTIES":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, properties: { ...layer.properties, ...action.properties } } : layer,
        ),
      }

    case "DELETE_LAYER":
      return {
        ...state,
        layers: state.layers.filter((layer) => layer.id !== action.id),
        selectedLayerIds: state.selectedLayerIds.filter((id) => id !== action.id),
      }

    case "SELECT_LAYERS":
      return {
        ...state,
        selectedLayerIds: action.ids,
      }

    case "SET_CURRENT_TIME":
      return {
        ...state,
        currentTime: Math.max(0, Math.min(action.time, state.duration)),
      }

    case "SET_PLAYING":
      return {
        ...state,
        isPlaying: action.playing,
      }

    case "SET_TOOL":
      return {
        ...state,
        selectedTool: action.tool,
      }

    case "ADD_KEYFRAME":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, keyframes: [...layer.keyframes, action.keyframe] } : layer,
        ),
      }

    case "UPDATE_KEYFRAME":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.layerId
            ? {
                ...layer,
                keyframes: layer.keyframes.map((kf) =>
                  kf.id === action.keyframeId ? { ...kf, ...action.updates } : kf,
                ),
              }
            : layer,
        ),
      }

    case "DELETE_KEYFRAME":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.layerId
            ? { ...layer, keyframes: layer.keyframes.filter((kf) => kf.id !== action.keyframeId) }
            : layer,
        ),
      }

    default:
      return state
  }
}

const AnimationContext = createContext<{
  state: AnimationState
  dispatch: React.Dispatch<AnimationAction>
} | null>(null)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(animationReducer, initialState)

  return <AnimationContext.Provider value={{ state, dispatch }}>{children}</AnimationContext.Provider>
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error("useAnimation must be used within AnimationProvider")
  }
  return context
}
