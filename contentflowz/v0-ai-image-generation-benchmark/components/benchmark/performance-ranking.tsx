"use client"

import type { ImageResult } from "@/lib/types"
import { sortImagesBySpeed } from "@/lib/stats"

type PerformanceRankingProps = {
  images: ImageResult[]
}

const modelColors: Record<string, string> = {
  "nano-banana-gateway": "var(--ds-green-700)",
  "fal-nano-banana": "var(--ds-blue-700)",
  "fal-flux-schnell": "var(--ds-amber-700)",
  "fal-flux-dev": "var(--ds-red-700)",
  "fal-flux-pro": "var(--ds-purple-700)",
  "fal-sd35-medium": "var(--ds-cyan-700)",
  "flux-fast-schnell": "var(--ds-pink-700)",
  "flux-fast-dev": "var(--ds-lime-700)",
  "flux-pro-11": "var(--ds-orange-700)",
  "flux-dev": "var(--ds-teal-700)",
  sd15: "var(--ds-indigo-700)",
  "grok-2-image": "var(--ds-violet-700)",
}

export function PerformanceRanking({ images }: PerformanceRankingProps) {
  const sortedImages = sortImagesBySpeed(images)
  const maxDuration = Math.max(...images.map((img) => img.durationMs), 1)

  return (
    <div className="space-y-3">
      {sortedImages.map((image, index) => {
        const percentage = (image.durationMs / maxDuration) * 100
        const barColor = modelColors[image.modelId] || "var(--ds-gray-700)"

        return (
          <div key={image.modelId}>
            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{image.modelName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{image.provider}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-muted-foreground mr-2">{image.duration}</span>
                <span className="text-xs font-mono text-muted-foreground">{image.cost}</span>
              </div>
            </div>
            <div className="w-full bg-muted h-6 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
