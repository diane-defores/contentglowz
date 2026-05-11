"use client"

import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type LimitReachedModalProps = {
  onClose: () => void
}

export function LimitReachedModal({ onClose }: LimitReachedModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div className="bg-card border border-border max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-medium mb-3">You've reached your limit</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've used all 5 free prompts. Want to create your own unlimited AI Image Generation Benchmark?
            </p>
          </div>

          <div className="bg-muted/50 border border-border p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Create Your Own Benchmark</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clone this template in v0 and deploy your own version with unlimited prompts. Customize the models, add
                your own features, and make it yours.
              </p>
            </div>

            <Button
              onClick={() => window.open("https://v0.app/templates/kz69KY1ux5H", "_blank")}
              className="w-full font-mono cursor-pointer"
              size="lg"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 1155 1000" fill="none">
                <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="currentColor" />
              </svg>
              Open Template in v0
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            <p>Free to clone • Deploy in minutes • Customize everything</p>
          </div>
        </div>
      </div>
    </div>
  )
}
