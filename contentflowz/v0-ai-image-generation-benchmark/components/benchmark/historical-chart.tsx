"use client"

import { useState, useEffect } from "react"
import { Maximize2, Download, X } from "lucide-react"
import { toPng } from "html-to-image"
import type { TestResult, ModelConfig } from "@/lib/types"

type HistoricalChartProps = {
  history: TestResult[]
  models: ModelConfig[]
  onClearHistory: () => void
  compact?: boolean
}

type HoveredPoint = {
  testIndex: number
  modelId: string
  modelName: string
  provider: string
  duration: string
  color: string
}

const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
]

const ChartSVG = ({
  id,
  compact,
  history,
  models,
  hoveredPoint,
  setHoveredPoint,
  selectedModels,
  toggleModel,
  maxTime,
}: {
  id: string
  compact: boolean
  history: TestResult[]
  models: ModelConfig[]
  hoveredPoint: HoveredPoint | null
  setHoveredPoint: (point: HoveredPoint | null) => void
  selectedModels: Set<string>
  toggleModel: (modelId: string) => void
  maxTime: number
}) => {
  const width = compact ? 400 : 800
  const height = compact ? 180 : 400
  const marginLeft = compact ? 30 : 60
  const marginRight = compact ? 20 : 40
  const marginTop = compact ? 20 : 40
  const marginBottom = compact ? 20 : 60
  const chartWidth = width - marginLeft - marginRight
  const chartHeight = height - marginTop - marginBottom
  const fontSize = compact ? 8 : 12
  const pointRadius = compact ? 3 : 5
  const lineWidth = compact ? 2 : 3

  return (
    <svg id={id} className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
      {/* Y-axis grid lines and labels */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line
            x1={marginLeft}
            y1={marginTop + (i * chartHeight) / 4}
            x2={width - marginRight}
            y2={marginTop + (i * chartHeight) / 4}
            stroke="#71717a"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <text
            x={marginLeft - 4}
            y={marginTop + (i * chartHeight) / 4 + 3}
            textAnchor="end"
            fill="#71717a"
            fontFamily="monospace"
            style={{ fontSize: `${fontSize}px` }}
          >
            {((((4 - i) / 4) * maxTime) / 1000).toFixed(1)}s
          </text>
        </g>
      ))}

      {/* Lines and points for each model */}
      {models.map((model, modelIndex) => {
        const lineColor = CHART_COLORS[modelIndex % CHART_COLORS.length]
        const isSelected = selectedModels.has(model.id)

        const modelData = history.map((test) => {
          const result = test.results.find((r) => r.modelId === model.id)
          return result?.success ? result.durationMs : null
        })

        const points = modelData
          .map((duration, testIndex) => {
            if (duration === null) return null
            const x = marginLeft + (testIndex * chartWidth) / (history.length - 1)
            const y = height - marginBottom - (duration / maxTime) * chartHeight
            return { x, y, duration, testIndex }
          })
          .filter((p) => p !== null)

        if (points.length === 0) return null

        const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p!.x},${p!.y}`).join(" ")

        return (
          <g key={model.id} opacity={isSelected ? "1" : "0.2"} className="transition-opacity duration-150">
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={lineWidth * 3}
              className="cursor-pointer"
              onClick={() => toggleModel(model.id)}
            />
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
              opacity="0.9"
              className="pointer-events-none"
              style={{
                filter: hoveredPoint?.modelId === model.id ? `drop-shadow(0 0 3px ${lineColor})` : "none",
              }}
            />
            {points.map((point) => (
              <circle
                key={point!.testIndex}
                cx={point!.x}
                cy={point!.y}
                r={
                  hoveredPoint?.modelId === model.id && hoveredPoint.testIndex === point!.testIndex
                    ? pointRadius + 1
                    : pointRadius
                }
                fill={lineColor}
                opacity="0.95"
                className="cursor-pointer transition-all"
                style={{
                  filter:
                    hoveredPoint?.modelId === model.id && hoveredPoint.testIndex === point!.testIndex
                      ? `drop-shadow(0 0 4px ${lineColor})`
                      : "none",
                }}
                onClick={() => toggleModel(model.id)}
                onMouseEnter={() => {
                  if (!isSelected) return
                  setHoveredPoint({
                    testIndex: point!.testIndex,
                    modelId: model.id,
                    modelName: model.name,
                    provider: model.provider,
                    duration: (point!.duration / 1000).toFixed(2) + "s",
                    color: lineColor,
                  })
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </g>
        )
      })}

      {/* X-axis labels (test numbers) */}
      {history.map((_, i) => {
        const x = marginLeft + (i * chartWidth) / (history.length - 1)
        return (
          <text
            key={i}
            x={x}
            y={height - marginBottom + (compact ? 15 : 20)}
            textAnchor="middle"
            fill="#71717a"
            fontFamily="monospace"
            style={{ fontSize: `${fontSize}px` }}
          >
            {i + 1}
          </text>
        )
      })}
    </svg>
  )
}

export function HistoricalChart({ history, models, onClearHistory, compact = false }: HistoricalChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null)
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(models.map((m) => m.id)))
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isFullscreen])

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground font-mono">
        Need at least 2 prompts for historical chart
      </div>
    )
  }

  const allDurations = history.flatMap((test) => test.results.filter((r) => r.success).map((r) => r.durationMs))
  const maxTime = Math.max(...allDurations, 1)

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
      }
      return next
    })
  }

  const downloadChart = async () => {
    try {
      const container = document.getElementById("fullscreen-download-container")

      if (!container) {
        console.error("Container not found")
        return
      }

      const dataUrl = await toPng(container, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#09090b",
        skipFonts: true,
        cacheBust: true,
      })

      const link = document.createElement("a")
      link.download = `benchmark-history-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      // Error is expected from CORS issues with external fonts but doesn't affect download
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div id="compact-download-container" className="border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Historical Performance</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">{history.length} test runs</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={downloadChart}
                className="p-1.5 hover:bg-accent rounded transition-colors cursor-pointer"
                title="Download as PNG"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="hidden md:block p-1.5 hover:bg-accent rounded transition-colors cursor-pointer"
                title="View fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative h-48">
            <ChartSVG
              id="chart-compact"
              compact={true}
              history={history}
              models={models}
              hoveredPoint={hoveredPoint}
              setHoveredPoint={setHoveredPoint}
              selectedModels={selectedModels}
              toggleModel={toggleModel}
              maxTime={maxTime}
            />

            {hoveredPoint && (
              <div
                className="absolute bg-card/95 backdrop-blur-sm border border-border shadow-xl rounded-lg p-2 text-[10px] space-y-1 pointer-events-none z-50"
                style={{
                  left: "50%",
                  top: "10px",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: hoveredPoint.color }} />
                  <div className="font-semibold">{hoveredPoint.modelName}</div>
                </div>
                <div className="text-muted-foreground font-mono text-[9px]">{hoveredPoint.provider}</div>
                <div className="flex justify-between gap-3 pt-1 border-t border-border">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-mono font-semibold">{hoveredPoint.duration}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto border-t border-border pt-3">
            <div className="text-[10px] text-muted-foreground font-mono mb-2">Model Legend</div>
            <div className="grid grid-cols-2 gap-1.5">
              {models.map((model, modelIndex) => {
                const lineColor = CHART_COLORS[modelIndex % CHART_COLORS.length]
                const isSelected = selectedModels.has(model.id)
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-accent/50 p-1.5 rounded transition-colors text-[11px]"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-opacity"
                      style={{ backgroundColor: lineColor, opacity: isSelected ? 1 : 0.3 }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`truncate font-mono transition-opacity ${isSelected ? "" : "opacity-40 line-through"}`}
                      >
                        {model.name}
                      </span>
                      <span className="text-muted-foreground text-[9px] truncate">({model.provider})</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={isFullscreen ? "" : "fixed -left-[9999px] -top-[9999px]"}>
        <div id="fullscreen-download-container" className="w-[1200px] bg-card rounded-lg p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold whitespace-nowrap">Performance History</h2>
              <p className="text-sm text-muted-foreground font-mono">{history.length} test runs across all models</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[320px] relative">
            <ChartSVG
              id="chart-fullscreen"
              compact={false}
              history={history}
              models={models}
              hoveredPoint={null}
              setHoveredPoint={() => {}}
              selectedModels={selectedModels}
              toggleModel={toggleModel}
              maxTime={maxTime}
            />
          </div>

          {/* Legend */}
          <div className="border-t border-border pt-4">
            <div className="text-sm text-muted-foreground font-mono mb-3">Model Legend</div>
            <div className="grid grid-cols-4 gap-3">
              {models.map((model, modelIndex) => {
                const lineColor = CHART_COLORS[modelIndex % CHART_COLORS.length]
                const isSelected = selectedModels.has(model.id)
                return (
                  <div key={model.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: lineColor, opacity: isSelected ? 1 : 0.3 }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`truncate font-mono text-sm ${isSelected ? "" : "opacity-40 line-through"}`}>
                        {model.name}
                      </span>
                      <span className="text-muted-foreground text-xs truncate">({model.provider})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="w-full max-w-6xl bg-card rounded-lg p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold whitespace-nowrap">Performance History</h2>
                <p className="text-sm text-muted-foreground font-mono">{history.length} test runs across all models</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadChart}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-mono">Download PNG</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 hover:bg-accent rounded transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[320px] relative">
              <ChartSVG
                id="chart-fullscreen-visible"
                compact={false}
                history={history}
                models={models}
                hoveredPoint={hoveredPoint}
                setHoveredPoint={setHoveredPoint}
                selectedModels={selectedModels}
                toggleModel={toggleModel}
                maxTime={maxTime}
              />

              {hoveredPoint && (
                <div
                  className="absolute bg-card/95 backdrop-blur-sm border border-border shadow-xl rounded-lg p-3 text-sm space-y-2 pointer-events-none z-50"
                  style={{
                    left: "50%",
                    top: "20px",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: hoveredPoint.color }} />
                    <div className="font-semibold">{hoveredPoint.modelName}</div>
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">{hoveredPoint.provider}</div>
                  <div className="flex justify-between gap-4 pt-2 border-t border-border">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-mono font-semibold">{hoveredPoint.duration}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="border-t border-border pt-4">
              <div className="text-sm text-muted-foreground font-mono mb-3">Model Legend</div>
              <div className="grid grid-cols-4 gap-3">
                {models.map((model, modelIndex) => {
                  const lineColor = CHART_COLORS[modelIndex % CHART_COLORS.length]
                  const isSelected = selectedModels.has(model.id)
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className="flex items-center gap-2 text-left hover:bg-accent p-2 rounded transition-colors cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0 transition-opacity"
                        style={{ backgroundColor: lineColor, opacity: isSelected ? 1 : 0.3 }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`truncate font-mono text-sm transition-opacity ${isSelected ? "" : "opacity-40 line-through"}`}
                        >
                          {model.name}
                        </span>
                        <span className="text-muted-foreground text-xs truncate">({model.provider})</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
