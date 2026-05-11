"use client"

import { useRef, useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, HelpCircle, Grid2X2, LogIn } from "lucide-react"
import { MODELS } from "@/lib/models"
import { saveHistory } from "@/lib/storage"
import type { ImageResult, TestResult } from "@/lib/types"
import { StatsHeader } from "@/components/benchmark/stats-header"
import { ImageGrid } from "@/components/benchmark/image-grid"
import { PerformanceRanking } from "@/components/benchmark/performance-ranking"
import { HistoricalChart } from "@/components/benchmark/historical-chart"
import { ImageModal } from "@/components/benchmark/image-modal"
import { HowItWorksModal } from "@/components/how-it-works-modal"
import { SignInModal } from "@/components/auth/sign-in-modal"
import { LimitReachedModal } from "@/components/auth/limit-reached-modal"
import { UserMenu } from "@/components/auth/user-menu"

type GenerationGroup = {
  prompt: string
  timestamp: number
  images: ImageResult[]
}

type User = {
  id: string
  name: string
  username: string
  email: string
  picture?: string
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [generations, setGenerations] = useState<GenerationGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<TestResult[]>([])
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [hasRunTest, setHasRunTest] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHoveringHandle, setIsHoveringHandle] = useState(false)
  const [isHoveringCollapsedArea, setIsHoveringCollapsedArea] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)
  const [gridColumns, setGridColumns] = useState(3)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    const isSigningIn = localStorage.getItem("signing_in") === "true"
    if (isSigningIn) {
      setSigningIn(true)
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userRes = await fetch("/api/auth/user")
        const userData = await userRes.json()

        if (userData.user) {
          localStorage.removeItem("signing_in")
          setSigningIn(false)

          setUser(userData.user)

          const savedGenerations = sessionStorage.getItem("saved_generations")
          const savedPrompt = sessionStorage.getItem("saved_prompt")

          if (savedGenerations) {
            try {
              const parsedGenerations = JSON.parse(savedGenerations)
              setGenerations(parsedGenerations)
              setHasRunTest(true)
              if (parsedGenerations.length > 0) {
                const restoredHistory: TestResult[] = parsedGenerations.map((gen: GenerationGroup, index: number) => ({
                  testId: index + 1,
                  timestamp: gen.timestamp,
                  prompt: gen.prompt,
                  results: gen.images,
                }))
                setHistory(restoredHistory)
                saveHistory(restoredHistory)
                setPrompt(parsedGenerations[parsedGenerations.length - 1].prompt)
              }
              sessionStorage.removeItem("saved_generations")
            } catch (e) {
              console.error("Failed to restore generations:", e)
            }
          }

          // Restore the prompt that was typed but not submitted
          if (savedPrompt) {
            setPrompt(savedPrompt)
            sessionStorage.removeItem("saved_prompt")
          }

          // Track login
          await fetch("/api/track-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData.user.id,
              email: userData.user.email,
              name: userData.user.name,
              avatarUrl: userData.user.picture,
            }),
          })
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err)
      }
    }

    initializeAuth()
  }, [])

  const handleTitleClick = () => {
    setHasRunTest(false)
    setGenerations([])
    setCompletedCount(0)
    setLoading(false)
    setError("")
    setPrompt("")
    sessionStorage.clear()
  }

  const checkCanGenerate = async (): Promise<boolean> => {
    // Check logged-in user limit (5 prompts)
    if (user) {
      try {
        const response = await fetch(`/api/check-user-limit?userId=${user.id}`)
        const data = await response.json()

        if (!data.canGenerate) {
          setShowLimitReachedModal(true)
          return false
        }

        return true
      } catch (error) {
        console.error("Failed to check user limit:", error)
        return false
      }
    }

    // Check IP limit for non-logged users (1 prompt)
    try {
      const response = await fetch("/api/track-ip")
      const data = await response.json()

      if (!data.canGenerate) {
        if (prompt.trim()) {
          sessionStorage.setItem("saved_prompt", prompt)
        }
        setShowSignInModal(true)
        return false
      }

      return true
    } catch (error) {
      console.error("Failed to check IP usage:", error)
      return false
    }
  }

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setLoading(true)
    setError("")

    const currentPrompt = prompt
    const newGeneration: GenerationGroup = {
      prompt: currentPrompt,
      timestamp: Date.now(),
      images: [],
    }

    // Show optimistic UI immediately
    setGenerations((prev) => [...prev, newGeneration])
    setCompletedCount(0)
    setHasRunTest(true)

    // Check permissions in background
    const canGenerate = await checkCanGenerate()
    if (!canGenerate) {
      // Revert optimistic UI if permission check fails
      setLoading(false)
      setGenerations((prev) => prev.slice(0, -1))
      setHasRunTest((prev) => prev.length > 0)
      return
    }

    // Track IP usage for non-logged users
    if (!user) {
      try {
        await fetch("/api/track-ip", { method: "POST" })
      } catch (error) {
        console.error("Failed to track IP:", error)
      }
    }

    try {
      const promises = MODELS.map(async (model) => {
        try {
          const response = await fetch("/api/generate-single", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: currentPrompt, model }),
          })

          const result: ImageResult = await response.json()
          return { result, completionTime: performance.now() }
        } catch (err) {
          const errorResult: ImageResult = {
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            imageUrl: null,
            duration: "0s",
            durationMs: 0,
            cost: "$0.0000",
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }

          return { result: errorResult, completionTime: performance.now() }
        }
      })

      const completedResults: Array<{ result: ImageResult; completionTime: number }> = []

      for (const promise of promises) {
        promise.then((data) => {
          completedResults.push(data)
          completedResults.sort((a, b) => a.completionTime - b.completionTime)

          setGenerations((prev) => {
            const updated = [...prev]
            const lastIndex = updated.length - 1
            if (lastIndex >= 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                images: completedResults.map((r) => r.result),
              }
            }
            return updated
          })
          setCompletedCount(completedResults.length)
        })
      }

      await Promise.all(promises)

      // Save to history and track prompt
      setGenerations((prev) => {
        const lastGen = prev[prev.length - 1]
        if (lastGen) {
          const newTest: TestResult = {
            testId: history.length + 1,
            timestamp: Date.now(),
            prompt: currentPrompt,
            results: lastGen.images,
          }
          const updatedHistory = [...history, newTest]
          setHistory(updatedHistory)
          saveHistory(updatedHistory)

          const successCount = lastGen.images.filter((img) => img.success).length
          const totalCost = lastGen.images
            .filter((img) => img.success)
            .reduce((sum, img) => sum + Number.parseFloat(img.cost.replace("$", "")), 0)

          fetch("/api/track-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: currentPrompt,
              modelCount: MODELS.length,
              successCount,
              totalCost: totalCost.toFixed(4),
              userId: user?.id || null,
            }),
          }).catch((err) => console.error("Failed to track prompt:", err))
        }
        return prev
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const currentWidth = isSidebarCollapsed ? 0 : sidebarWidth

    setResizeStartX(e.clientX)
    setIsResizing(true)
    setHasDragged(false)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const dragDistance = Math.abs(e.clientX - resizeStartX)
      if (dragDistance < 5) return

      if (!hasDragged) {
        setHasDragged(true)
        if (isSidebarCollapsed) {
          setIsSidebarCollapsed(false)
        }
      }

      const distanceFromRight = window.innerWidth - e.clientX
      const newWidth = Math.max(0, distanceFromRight - 32)

      if (newWidth < 200) {
        if (!isSidebarCollapsed) {
          setIsSidebarCollapsed(true)
        }
        return
      }

      if (isSidebarCollapsed && newWidth >= 200) {
        setIsSidebarCollapsed(false)
      }

      const constrainedWidth = Math.min(Math.max(newWidth, 250), 600)
      setSidebarWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setHasDragged(false)
    }

    if (isResizing) {
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, isSidebarCollapsed, sidebarWidth, resizeStartX, hasDragged])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      generateImages()
    }
  }

  const handleSignIn = () => {
    setSigningIn(true)
    localStorage.setItem("signing_in", "true")
    window.location.href = "/api/auth/login"
  }

  const latestGeneration = generations[generations.length - 1]
  const currentImages = latestGeneration?.images || []
  const allComplete = completedCount === MODELS.length && !loading

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {hasRunTest && (
        <header className="sticky top-0 bg-background/95 backdrop-blur z-10 animate-in fade-in slide-in-from-top-4 duration-500 p-4 md:p-6">
          <div className="pb-3">
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-start justify-between gap-3 md:gap-0">
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <img src="/logo.svg" alt="Logo" className="w-6 h-6 md:w-7 md:h-7" />
                  <h1
                    onClick={handleTitleClick}
                    className="text-lg md:text-xl font-medium tracking-tight cursor-pointer hover:text-primary transition-colors"
                  >
                    AI Image Generation Benchmark
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Compare image generation performance across {MODELS.length} models
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <div className="hidden md:flex items-center gap-1 border border-border rounded-md bg-background">
                  <div className="px-1.5 md:px-2 py-1 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Grid2X2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Grid:</span>
                  </div>
                  {[2, 3, 4, 5].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setGridColumns(cols)}
                      className={`px-1.5 md:px-2 py-1 text-xs font-mono transition-colors ${
                        gridColumns === cols
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      } ${cols === 2 ? "rounded-l" : ""} ${cols === 5 ? "rounded-r" : ""}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHowItWorks(true)}
                  className="gap-1.5 md:gap-2 text-xs md:text-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">How it works</span>
                  <span className="sm:hidden">Info</span>
                </Button>
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignIn}
                    disabled={signingIn}
                    className="gap-1.5 md:gap-2 cursor-pointer text-xs md:text-sm bg-transparent"
                  >
                    {signingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                        <span className="hidden sm:inline">Signing in...</span>
                        <span className="sm:hidden">Loading</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Sign In</span>
                        <span className="sm:hidden">Login</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

          <div className="pb-4">
            <div className="flex justify-center">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-3xl">
                <Input
                  type="text"
                  placeholder="Enter prompt to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  autoFocus
                  className="flex-1 font-mono text-base h-20 sm:h-12"
                />
                <Button
                  onClick={generateImages}
                  disabled={loading || !prompt.trim()}
                  className="px-6 sm:px-10 font-mono h-12 text-sm md:text-base cursor-pointer w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running
                    </>
                  ) : (
                    "Execute"
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive text-xs text-destructive font-mono">
                {error}
              </div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </header>
      )}

      {!hasRunTest && (
        <div className="flex-1 flex items-center justify-center px-4 md:px-6">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <div className="absolute top-4 md:top-6 right-4 md:right-6">
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignIn}
                    disabled={signingIn}
                    className="gap-1.5 md:gap-2 cursor-pointer text-xs md:text-sm bg-transparent"
                  >
                    {signingIn ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                        <span className="hidden sm:inline">Signing in...</span>
                        <span className="sm:hidden">Loading</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" viewBox="0 0 1155 1000" fill="none">
                          <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="currentColor" />
                        </svg>
                        <span className="hidden sm:inline">Sign in with Vercel</span>
                        <span className="sm:hidden">Sign In</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex justify-center mb-3">
                <img src="/logo.svg" alt="Logo" className="w-12 h-12 md:w-14 md:h-14" />
              </div>
              <h1 className="text-2xl md:text-4xl font-medium tracking-tight mb-3 px-4">
                AI Image Generation Benchmark
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-mono px-4">
                Compare image generation performance across {MODELS.length} models
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 md:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5">
                <Input
                  type="text"
                  placeholder="Enter prompt to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  autoFocus
                  className="flex-1 font-mono text-base h-20 sm:h-14"
                />
                <Button
                  onClick={generateImages}
                  disabled={loading || !prompt.trim()}
                  className="px-6 sm:px-10 font-mono h-12 sm:h-14 text-sm md:text-base cursor-pointer w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running
                    </>
                  ) : (
                    "Execute"
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-2.5 bg-destructive/10 border border-destructive text-xs text-destructive font-mono rounded">
                  {error}
                </div>
              )}

              <div className="mt-5 flex justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHowItWorks(true)}
                  className="gap-2 text-muted-foreground cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  How it works
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="py-3 flex-1 px-4 md:px-6">
        {generations.length > 0 && (
          <div className="space-y-8">
            {[...generations].reverse().map((generation, reversedIndex) => {
              const genIndex = generations.length - 1 - reversedIndex
              const isLatest = genIndex === generations.length - 1
              const genSuccessfulImages = generation.images.filter((img) => img.success)
              const genAllComplete = isLatest ? allComplete : true

              return (
                <div key={generation.timestamp} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-4">
                    <h2 className="text-base font-medium">
                      Prompt: <span className="font-mono text-muted-foreground">{generation.prompt}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {new Date(generation.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Main content area - full width on mobile, constrained on desktop */}
                      <div className="w-full lg:flex-1 lg:min-w-0">
                        <ImageGrid
                          models={MODELS}
                          images={generation.images}
                          loading={isLatest && loading}
                          onImageClick={setExpandedImage}
                          gridColumns={gridColumns}
                        />
                      </div>

                      {/* Sidebar - below content on mobile, beside on desktop */}
                      <div className="w-full lg:w-auto lg:flex-shrink-0 lg:flex">
                        {isSidebarCollapsed && isLatest && (
                          <div
                            className="hidden lg:block relative"
                            onMouseEnter={() => setIsHoveringCollapsedArea(true)}
                            onMouseLeave={() => setIsHoveringCollapsedArea(false)}
                            onMouseDown={handleMouseDown}
                            style={{
                              width: "48px",
                              height: "100%",
                              cursor: "pointer",
                            }}
                          >
                            {isHoveringCollapsedArea && (
                              <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-20 bg-primary/70 hover:bg-primary transition-colors duration-200 rounded-l"
                                title="Drag to expand sidebar"
                              />
                            )}
                          </div>
                        )}

                        {!isSidebarCollapsed && (
                          <>
                            {isLatest && (
                              <div
                                className="hidden lg:flex relative items-center justify-center cursor-col-resize group"
                                onMouseDown={handleMouseDown}
                                onMouseEnter={() => setIsHoveringHandle(true)}
                                onMouseLeave={() => setIsHoveringHandle(false)}
                                style={{ width: "16px" }}
                              >
                                <div className="absolute inset-y-0 -left-4 -right-4" />

                                {(isHoveringHandle || isResizing) && (
                                  <>
                                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-full shadow-lg" />
                                  </>
                                )}
                              </div>
                            )}

                            <div
                              ref={isLatest ? sidebarRef : undefined}
                              className="space-y-4 w-full"
                              style={{
                                width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : "100%",
                              }}
                            >
                              <div className="bg-card border border-border p-5">
                                <h2 className="text-base font-medium mb-3">Summary</h2>
                                <StatsHeader
                                  images={generation.images}
                                  totalModels={MODELS.length}
                                  loading={isLatest && loading}
                                  completedCount={isLatest ? completedCount : generation.images.length}
                                />
                              </div>

                              <div className="bg-card border border-border p-5 min-h-[350px]">
                                {!genAllComplete && loading ? (
                                  <div className="space-y-3">
                                    {[...Array(Math.min(completedCount || 5, MODELS.length))].map((_, i) => (
                                      <div
                                        key={i}
                                        className="animate-in fade-in duration-300"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                      >
                                        <div className="flex justify-between items-baseline mb-1.5">
                                          <div className="flex items-center gap-2">
                                            <div className="h-3 w-4 bg-muted animate-pulse" />
                                            <div className="flex flex-col gap-1">
                                              <div className="h-3 w-32 bg-muted animate-pulse" />
                                              <div className="h-2.5 w-20 bg-muted/70 animate-pulse" />
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <div className="h-3 w-12 bg-muted animate-pulse" />
                                            <div className="h-3 w-16 bg-muted animate-pulse" />
                                          </div>
                                        </div>
                                        <div className="w-full bg-muted h-5 overflow-hidden">
                                          <div className="h-full bg-muted/70 animate-pulse" style={{ width: "60%" }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  genSuccessfulImages.length > 0 && <PerformanceRanking images={genSuccessfulImages} />
                                )}
                              </div>

                              {isLatest && history.length >= 2 && (
                                <HistoricalChart history={history} models={MODELS} compact />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-3 bg-background mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
          <a
            href="https://v0.app/templates/kz69KY1ux5H"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline font-mono"
          >
            Open in v0
          </a>
          <p className="text-center">
            Feedback?{" "}
            <a
              href="https://x.com/estebansuarez"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              Send me a DM!
            </a>
          </p>
        </div>
      </footer>

      <ImageModal imageUrl={expandedImage} onClose={() => setExpandedImage(null)} />
      <HowItWorksModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      {showSignInModal && <SignInModal onClose={() => setShowSignInModal(false)} currentGenerations={generations} />}
      {showLimitReachedModal && <LimitReachedModal onClose={() => setShowLimitReachedModal(false)} />}
    </div>
  )
}
