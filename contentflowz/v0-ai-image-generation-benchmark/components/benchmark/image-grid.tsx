"use client"

import { Loader2, AlertCircle, Expand } from "lucide-react"
import type { ImageResult, ModelConfig } from "@/lib/types"

type ImageGridProps = {
  models: ModelConfig[]
  images: ImageResult[] // Changed from Map to array to maintain arrival order
  loading: boolean
  onImageClick: (imageUrl: string) => void
  gridColumns?: number
}

export function ImageGrid({ models, images, loading, onImageClick, gridColumns = 3 }: ImageGridProps) {
  const gridClass =
    {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
    }[gridColumns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  const imageMap = new Map(images.map((img) => [img.modelId, img]))

  const completedImages = images
  const pendingModels = models.filter((model) => !imageMap.has(model.id))

  return (
    <div className={`grid ${gridClass} gap-4 w-full`}>
      {completedImages.map((image) => (
        <div key={image.modelId} className="border border-border bg-card group flex flex-col">
          <div
            className="bg-muted flex items-center justify-center relative overflow-hidden cursor-pointer aspect-square"
            onClick={() => {
              if (image.success && image.imageUrl) {
                onImageClick(image.imageUrl)
              }
            }}
          >
            {image.success && image.imageUrl ? (
              <>
                <img
                  src={image.imageUrl || "/placeholder.svg"}
                  alt={`${image.modelName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Expand className="w-6 h-6 text-white" />
                </div>
              </>
            ) : image.error ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
                <p className="text-[10px] text-destructive font-mono">Failed</p>
              </div>
            ) : null}
          </div>

          <div className="p-3 border-t border-border h-[72px] flex flex-col justify-between flex-shrink-0">
            <h3 className="font-medium text-xs truncate leading-tight">{image.modelName}</h3>
            <div className="flex justify-between items-end text-[10px] font-mono text-muted-foreground">
              <span className="truncate">{image.provider}</span>
              <div className="text-right whitespace-nowrap ml-2 flex flex-col gap-0.5 min-w-[60px] h-[28px] justify-end">
                {image.success && (
                  <>
                    <div className="text-foreground leading-tight">{image.duration}</div>
                    <div className="text-foreground leading-tight">{image.cost}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {loading &&
        pendingModels.map((model, index) => (
          <div key={`pending-${index}`} className="border border-border bg-card group flex flex-col">
            <div className="bg-muted flex items-center justify-center relative overflow-hidden aspect-square">
              <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
            </div>

            <div className="p-3 border-t border-border h-[72px] flex flex-col justify-between flex-shrink-0">
              <div className="h-4" /> {/* Espacio vacío donde iría el nombre */}
              <div className="flex justify-between items-end text-[10px] font-mono text-muted-foreground">
                <span className="truncate opacity-0">-</span>
                <div className="text-right whitespace-nowrap ml-2 flex flex-col gap-0.5 min-w-[60px] h-[28px] justify-end" />
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
