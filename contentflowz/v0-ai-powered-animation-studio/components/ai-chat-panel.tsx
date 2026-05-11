"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAnimation, type AnimationLayer } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Bot,
  User,
  Wand2,
  Loader2,
  Sparkles,
  Zap,
  Palette,
  RotateCw,
  Move,
  Scale,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolInvocations?: Array<{
    toolCallId: string
    toolName: string
    args: any
    result?: any
  }>
}

export function AIChatPanel() {
  const { state, dispatch } = useAnimation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set())
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const selectedLayer = state.layers.find((layer) => state.selectedLayerIds.includes(layer.id))
      const contextData = {
        selectedLayer: selectedLayer
          ? {
              id: selectedLayer.id,
              name: selectedLayer.name,
              type: selectedLayer.type,
              properties: selectedLayer.properties,
              content: selectedLayer.content,
            }
          : null,
        totalLayers: state.layers.length,
        currentTime: state.currentTime,
        duration: state.duration,
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: contextData,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: data.message || "I'm processing your request...",
        toolInvocations: [],
      }

      if (data.toolCall) {
        const toolInvocation = {
          toolCallId: `tool_${Date.now()}`,
          toolName: data.toolCall.action,
          args: data.toolCall,
          result: data.toolCall,
        }

        assistantMessage.toolInvocations = [toolInvocation]

        executeToolCall(data.toolCall)
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const executeToolCall = (toolResult: any) => {
    switch (toolResult.action) {
      case "add_shape":
        const newLayer: AnimationLayer = {
          id: `layer_${Date.now()}`,
          name: toolResult.name || `${toolResult.shape} ${Date.now()}`,
          type: toolResult.shape === "text" ? "text" : "shape",
          visible: true,
          locked: false,
          properties: {
            x: toolResult.x || 100,
            y: toolResult.y || 100,
            width: toolResult.width || toolResult.r * 2 || 60,
            height: toolResult.height || toolResult.r * 2 || 60,
            rotation: toolResult.rotation || 0,
            opacity: toolResult.opacity || 1,
            scaleX: 1,
            scaleY: 1,
          },
          keyframes: [],
          content: {
            shape: toolResult.shape,
            fill: toolResult.color || "#3b82f6",
            text: toolResult.content || undefined,
          },
        }
        dispatch({ type: "ADD_LAYER", layer: newLayer })
        break

      case "add_text":
        const textLayer: AnimationLayer = {
          id: `layer_${Date.now()}`,
          name: toolResult.name || "Text Layer",
          type: "text",
          visible: true,
          locked: false,
          properties: {
            x: toolResult.x || 150,
            y: toolResult.y || 200,
            width: toolResult.width || 200,
            height: toolResult.height || 50,
            rotation: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
          },
          keyframes: [],
          content: {
            text: toolResult.text || "Hello World!",
            fill: toolResult.color || "#000000",
            fontSize: toolResult.fontSize || 24,
            fontFamily: toolResult.fontFamily || "Arial",
          },
        }
        dispatch({ type: "ADD_LAYER", layer: textLayer })
        break

      case "update_properties":
        if (toolResult.layerId) {
          if (toolResult.properties.content) {
            const layer = state.layers.find((l) => l.id === toolResult.layerId)
            if (layer) {
              dispatch({
                type: "UPDATE_LAYER",
                id: toolResult.layerId,
                updates: {
                  content: { ...layer.content, ...toolResult.properties.content },
                },
              })
            }
          } else {
            dispatch({
              type: "UPDATE_LAYER_PROPERTIES",
              layerId: toolResult.layerId,
              properties: toolResult.properties,
            })
          }
        }
        break

      case "transform":
        if (toolResult.layerId) {
          dispatch({
            type: "UPDATE_LAYER_PROPERTIES",
            layerId: toolResult.layerId,
            properties: toolResult.transform,
          })
        }
        break

      case "update_animation":
        if (toolResult.layerId && toolResult.keyframes) {
          const layer = state.layers.find((l) => l.id === toolResult.layerId)
          if (layer) {
            layer.keyframes.forEach((kf) => {
              dispatch({
                type: "DELETE_KEYFRAME",
                layerId: toolResult.layerId,
                keyframeId: kf.id,
              })
            })

            toolResult.keyframes.forEach((kf: any) => {
              dispatch({
                type: "ADD_KEYFRAME",
                layerId: toolResult.layerId,
                keyframe: {
                  id: `kf_${Date.now()}_${Math.random()}`,
                  time: kf.time,
                  properties: kf.properties,
                  easing: kf.easing || "ease-in-out",
                },
              })
            })
          }
        }
        break

      default:
        console.log("Unknown tool call:", toolResult)
    }
  }

  const renderToolCall = (toolCall: any, messageId: string) => {
    const isExpanded = expandedToolCalls.has(`${messageId}_${toolCall.toolCallId}`)

    const getToolDescription = (toolCall: any) => {
      const args = toolCall.args
      switch (toolCall.toolName) {
        case "add_shape":
          return `Created ${args.shape} "${args.name}" at (${args.x}, ${args.y})`
        case "add_text":
          return `Added text "${args.text}" at (${args.x}, ${args.y})`
        case "update_properties":
          return `Updated properties of layer`
        case "transform":
          return `Applied transformation to layer`
        case "update_animation":
          return `Added ${args.keyframes?.length || 0} keyframes for animation`
        default:
          return `Executed ${toolCall.toolName}`
      }
    }

    const toggleExpanded = () => {
      const key = `${messageId}_${toolCall.toolCallId}`
      const newExpanded = new Set(expandedToolCalls)
      if (isExpanded) {
        newExpanded.delete(key)
      } else {
        newExpanded.add(key)
      }
      setExpandedToolCalls(newExpanded)
    }

    return (
      <div className="mt-2 p-2 bg-white/10 rounded-lg border border-white/20">
        <div className="flex items-center gap-2 cursor-pointer text-xs" onClick={toggleExpanded}>
          <Wand2 className="w-3 h-3 text-gray-600" />
          <span className="font-medium text-gray-500">{getToolDescription(toolCall)}</span>
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>

        {isExpanded && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
            <div className="text-gray-500">
              Tool: <span className="text-gray-800">{toolCall.toolName}</span>
            </div>
            {Object.entries(toolCall.args).map(([key, value]) => (
              <div key={key} className="text-gray-500">
                {key}: <span className="text-gray-800">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const quickActions = [
    { label: "Bouncing Ball", prompt: "Create a colorful bouncing ball animation", icon: "🏀" },
    { label: "Fade Text", prompt: "Create text that says 'Welcome!' and make it fade in smoothly", icon: "✨" },
    { label: "Slide Card", prompt: "Create a blue rectangle that slides in from the left side", icon: "📱" },
    { label: "Spin Circle", prompt: "Create a purple circle that rotates continuously", icon: "🔄" },
    { label: "Change Color", prompt: "Change the selected shape to yellow", icon: <Palette className="w-3 h-3" /> },
    {
      label: "Rotate Selected",
      prompt: "Make the selected shape rotate 360 degrees",
      icon: <RotateCw className="w-3 h-3" />,
    },
    { label: "Move Selected", prompt: "Move the selected shape to the right", icon: <Move className="w-3 h-3" /> },
    { label: "Scale Selected", prompt: "Make the selected shape grow larger", icon: <Scale className="w-3 h-3" /> },
    { label: "Fade Selected", prompt: "Make the selected shape fade out", icon: <Eye className="w-3 h-3" /> },
  ]

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      }
    }, 100)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-background/50">
      <div className="p-2 border-b border-border/50 bg-background/80 backdrop-blur">
        <h3 className="text-xs font-semibold flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          AI Assistant
          {isLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Powered by Gemini AI</p>
      </div>

      <div className="p-2 border-b border-border/50 bg-background/30">
        <div className="text-xs font-medium mb-1 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          Quick Actions
        </div>
        <div className="grid grid-cols-3 gap-1">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="justify-center h-auto p-1 text-center hover:bg-primary/5 hover:border-primary/20 bg-transparent"
              onClick={() => handleQuickAction(action.prompt)}
            >
              <div className="flex flex-col items-center gap-0.5">
                {typeof action.icon === "string" ? <span className="text-xs">{action.icon}</span> : action.icon}
                <span className="font-medium text-xs leading-tight">{action.label}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-2 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-600/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-medium mb-1 text-xs">Hello! I'm your AI animation assistant.</h4>
                <p className="text-xs mb-2">I can help you create amazing animations with natural language!</p>

                <div className="text-xs space-y-1 max-w-xs mx-auto">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Try saying:</p>
                    <ul className="space-y-0.5 text-left text-xs">
                      <li>• "Create a bouncing yellow ball"</li>
                      <li>• "Add text that says Hello World"</li>
                      <li>• "Change selected to blue"</li>
                      <li>• "Rotate the selected shape"</li>
                      <li>• "Make it fade out slowly"</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-1.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-2 rounded-xl text-xs ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-muted/70 backdrop-blur"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.toolInvocations?.map((toolCall) => (
                    <div key={toolCall.toolCallId}>{renderToolCall(toolCall, message.id)}</div>
                  ))}
                </div>

                {message.role === "user" && (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-2 border-t border-border/50 bg-background/80 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <Input
            placeholder="Describe the animation you want..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-background/50 border-border/50 h-7 text-xs"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-7 px-2"
          >
            {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
