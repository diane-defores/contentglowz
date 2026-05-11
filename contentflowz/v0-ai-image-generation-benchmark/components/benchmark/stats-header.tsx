import { Clock, DollarSign, Zap } from "lucide-react"
import type { ImageResult } from "@/lib/types"
import { calculateStats } from "@/lib/stats"

type StatsHeaderProps = {
  images: ImageResult[] // Changed from Map to array
  totalModels: number
  loading: boolean
  completedCount: number
}

export function StatsHeader({ images, totalModels, loading, completedCount }: StatsHeaderProps) {
  const successfulImages = images.filter((img) => img.success)
  const allComplete = completedCount === totalModels && !loading
  const stats = calculateStats(successfulImages)

  return (
    <div className="space-y-3 text-sm font-mono">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Progress</span>
        <span className="text-foreground font-medium">
          {completedCount}/{totalModels}
        </span>
      </div>
      {allComplete && successfulImages.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Average
            </span>
            <span className="text-foreground font-medium">{stats.avgDuration}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              Total Cost
            </span>
            <span className="text-foreground font-medium">${stats.totalCost}</span>
          </div>
          {stats.fastestModel && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Fastest
              </span>
              <span className="text-foreground font-medium">{stats.fastestModel.modelName}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
