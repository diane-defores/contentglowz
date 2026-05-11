"use client"
import { AnimationCanvas } from "@/components/animation-canvas"
import { TimelinePanel } from "@/components/timeline-panel"
import { LayerPanel } from "@/components/layer-panel"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { AnimationTemplates } from "@/components/animation-templates"
import { AnimationProvider } from "@/contexts/animation-context"
import { Button } from "@/components/ui/button"
import { Save, FolderOpen, Play, Pause, Square } from "lucide-react"
import { useAnimation } from "@/contexts/animation-context"

function StudioHeader() {
  const { state, dispatch } = useAnimation()

  return (
    <header className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-background/95 backdrop-blur text-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Animation Studio
        </h1>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_PLAYING", playing: !state.isPlaying })}
            className="gap-1 h-8 px-2"
          >
            {state.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {state.isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_CURRENT_TIME", time: 0 })}
            className="h-8 px-2"
          >
            <Square className="w-3 h-3" />
          </Button>
          <span className="text-xs text-muted-foreground ml-2">{state.currentTime.toFixed(2)}s</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AnimationTemplates />
        <Button variant="outline" size="sm" className="gap-1 h-8 px-2 bg-transparent text-xs">
          <FolderOpen className="w-3 h-3" />
          Open
        </Button>
        <Button variant="outline" size="sm" className="gap-1 h-8 px-2 bg-transparent text-xs">
          <Save className="w-3 h-3" />
          Save
        </Button>
      </div>
    </header>
  )
}

function StudioContent() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Layers */}
      <div className="w-64 border-r border-border/50 bg-background/50">
        <LayerPanel />
      </div>

      {/* Center - Canvas and Timeline */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
          <div className="absolute inset-0">
            <AnimationCanvas />
          </div>
        </div>

        {/* Timeline */}
        <div className="h-32 border-t border-border/50 bg-background/95">
          <TimelinePanel />
        </div>
      </div>

      {/* Right Panel - AI Assistant */}
      <div className="w-80 border-l border-border/50 bg-background/50">
        <AIChatPanel />
      </div>
    </div>
  )
}

export default function AnimationStudio() {
  return (
    <AnimationProvider>
      <div className="h-screen flex flex-col bg-background text-foreground">
        <StudioHeader />
        <StudioContent />
      </div>
    </AnimationProvider>
  )
}
