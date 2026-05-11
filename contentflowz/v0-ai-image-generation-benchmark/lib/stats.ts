import type { ImageResult } from "./types"

export function calculateStats(images: ImageResult[]) {
  const successful = images.filter((img) => img.success)

  if (successful.length === 0) {
    return {
      avgDuration: "0",
      totalCost: "0.0000",
      fastestModel: null,
    }
  }

  const avgDuration = (successful.reduce((sum, img) => sum + img.durationMs, 0) / successful.length / 1000).toFixed(2)

  const totalCost = successful.reduce((sum, img) => sum + Number.parseFloat(img.cost.replace("$", "")), 0).toFixed(4)

  const fastestModel = successful.reduce((prev, curr) => (prev.durationMs < curr.durationMs ? prev : curr))

  return {
    avgDuration,
    totalCost,
    fastestModel,
  }
}

export function sortImagesBySpeed(images: ImageResult[]): ImageResult[] {
  return [...images].sort((a, b) => a.durationMs - b.durationMs)
}
