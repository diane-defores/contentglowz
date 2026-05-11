"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const XIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

const Grid2x2Icon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 12h18" />
    <path d="M12 3v18" />
  </svg>
)

const SquareIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>
)

type GeneratedImage = {
  mimeType: string
  dataUrl: string | null // This will now be a Storage URL instead of base64
  url?: string // Added for Storage URLs
}

type GenerationResult = {
  id: string
  images: Array<{ mimeType: string; dataUrl: string; url?: string }>
  error?: string
  prompt?: string
  aspectRatio?: string
  referenceImages?: string[]
  timestamp: number
}

const HISTORY_STORAGE_KEY = "flux-playground-history"
const PENDING_GENERATION_KEY = "flux-pending-generation"
const ANONYMOUS_HISTORY_KEY = "flux-anonymous-history"

// Changed to FluxPlayground and updated state types
export default function FluxPlayground() {
  const [prompt, setPrompt] = useState("")
  const [numberOfImages, setNumberOfImages] = useState("1") // Changed to string for Select
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [quality, setQuality] = useState("standard")
  const [loading, setLoading] = useState(false) // Renamed to isLoading
  const [progress, setProgress] = useState(0) // Renamed to loadingProgress
  const [result, setResult] = useState<GenerationResult | null>(null) // Consolidated into generatedImages and history
  const [history, setHistory] = useState<
    Array<{
      id: string // Added id for delete functionality
      prompt: string
      aspectRatio: string
      numberOfImages: number
      images: { dataUrl: string; mimeType: string }[]
      timestamp: number // Added timestamp for ordering
    }>
  >([])
  const [displayResult, setDisplayResult] = useState<GenerationResult | null>(null) // Consolidated into selectedImage and history
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "gallery">("single")
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [user, setUser] = useState<any>(null) // Simplified user type
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null) // New ref

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/user")
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          await migrateAnonymousGenerations()
          await loadHistoryFromSupabase()
        } else {
          setUser(null)
          loadAnonymousHistory()
        }
      }
    } catch (error) {
      console.error("[v0] Error checking session:", error)
      setUser(null)
      loadAnonymousHistory()
    } finally {
      setAuthLoading(false)
    }
  }

  const loadAnonymousHistory = () => {
    try {
      const savedHistory = localStorage.getItem(ANONYMOUS_HISTORY_KEY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed)
      }
    } catch (error) {
      console.error("[v0] Error loading anonymous history:", error)
    }
  }

  const migrateAnonymousGenerations = async () => {
    try {
      console.log("[v0] Claiming anonymous generations...")
      const response = await fetch("/api/generations/claim", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Claimed", data.claimed, "anonymous generations")
      }
    } catch (error) {
      console.error("[v0] Error claiming anonymous generations:", error)
    }

    // Clear anonymous localStorage
    localStorage.removeItem(ANONYMOUS_HISTORY_KEY)
    // Reload history from Supabase (now includes claimed anonymous generations)
    await loadHistoryFromSupabase()
  }

  const loadHistoryFromSupabase = async () => {
    try {
      const response = await fetch("/api/generations")
      if (!response.ok) return

      const data = await response.json()

      const loadedHistory = data.generations.map((gen: any) => ({
        id: gen.id,
        prompt: gen.prompt,
        aspectRatio: gen.aspect_ratio,
        referenceImages: gen.reference_images,
        timestamp: new Date(gen.created_at).getTime(),
        images: gen.images.map((imageUrl: string) => ({
          dataUrl: imageUrl, // Storage URL used directly
          url: imageUrl,
          mimeType: "image/png",
        })),
      }))

      // Sort history by timestamp in descending order
      loadedHistory.sort((a: GenerationResult, b: GenerationResult) => b.timestamp - a.timestamp)
      setHistory(loadedHistory)
    } catch (error) {
      console.error("[v0] Error loading generations:", error)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (user) {
      const pendingGen = sessionStorage.getItem("PENDING_GENERATION") // Updated key
      if (pendingGen) {
        try {
          const {
            prompt: savedPrompt,
            referenceImages: savedRefs,
            numberOfImages: savedNum,
            aspectRatio: savedRatio,
            quality: savedQuality,
          } = JSON.parse(pendingGen)
          sessionStorage.removeItem("PENDING_GENERATION") // Updated key

          // Restore the generation params and execute
          setPrompt(savedPrompt)
          setReferenceImages(savedRefs)
          setNumberOfImages(savedNum)
          setAspectRatio(savedRatio)
          setQuality(savedQuality)

          // Execute generation after a short delay to ensure state is updated
          setTimeout(() => {
            executeGeneration(savedPrompt, savedRefs, savedNum, savedRatio, savedQuality)
          }, 500)
        } catch (error) {
          console.error("Failed to restore pending generation:", error)
        }
      }
    }
  }, [user])

  // Removed localStorage history loading and saving
  // useEffect(() => {
  //   const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
  //   if (savedHistory) {
  //     try {
  //       setHistory(JSON.parse(savedHistory))
  //     } catch (error) {
  //       console.error("Failed to load history from localStorage")
  //     }
  //   }
  // }, [])

  // useEffect(() => {
  //   if (history.length > 0) {
  //     localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  //   }
  // }, [history])

  useEffect(() => {
    if (!loading) {
      setProgress(0)
      return
    }

    const duration = 15000 // 15 seconds
    const interval = 50 // Update every 50ms for smooth animation
    const increment = (interval / duration) * 90 // Reach 90% in 15 seconds

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        return next >= 90 ? 90 : next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [loading])

  // Removed Supabase loading effect as it's handled in checkSession
  // useEffect(() => {
  //   if (user) {
  //     loadGenerationsFromSupabase()
  //   }
  // }, [user])

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only hide if leaving the window completely
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false)
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const remainingSlots = 8 - referenceImages.length
      const filesToProcess = Array.from(files).slice(0, remainingSlots)

      for (const file of filesToProcess) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            setReferenceImages((prev) => [...prev, dataUrl])
          }
          reader.readAsDataURL(file)
        }
      }
    }

    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("dragleave", handleDragLeave)
    document.addEventListener("drop", handleDrop)

    return () => {
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("dragleave", handleDragLeave)
      document.removeEventListener("drop", handleDrop)
    }
  }, [referenceImages.length])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenImage) {
        setFullscreenImage(null)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [fullscreenImage])

  useEffect(() => {
    if (!loading) {
      setProgress(0)
      return
    }

    const duration = 15000 // 15 seconds
    const interval = 50 // Update every 50ms for smooth animation
    const increment = (interval / duration) * 90 // Reach 90% in 15 seconds

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        return next >= 90 ? 90 : next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [loading])

  const handleDeleteGeneration = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the history item click

    if (!confirm("Are you sure you want to delete this generation?")) {
      return
    }

    try {
      const response = await fetch(`/api/generations/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete generation")
      }

      // Remove from local history state
      setHistory((prev) => prev.filter((item) => item.id !== id))

      // Clear displayResult if it was the deleted item
      if (displayResult?.id === id) {
        setDisplayResult(null)
      }

      console.log("[v0] Generation deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting generation:", error)
      alert("Failed to delete generation. Please try again.")
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    await executeGeneration(prompt, referenceImages, numberOfImages, aspectRatio, quality)
  }

  const executeGeneration = async (
    genPrompt: string,
    genReferenceImages: string[],
    genNumberOfImages: string, // Updated type
    genAspectRatio: string,
    genQuality: string,
  ) => {
    setPrompt(genPrompt)
    setReferenceImages(genReferenceImages)
    setNumberOfImages(genNumberOfImages)
    setAspectRatio(genAspectRatio)
    setQuality(genQuality)

    setLoading(true) // Renamed
    setProgress(0) // Renamed

    try {
      const response = await fetch("/api/generate-with-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: genPrompt,
          n: Number.parseInt(genNumberOfImages), // Ensure number
          aspectRatio: genAspectRatio,
          quality: genQuality,
          referenceImages: genReferenceImages,
        }),
      })

      if (response.status === 401) {
        const errorData = await response.json()

        // Rate limit exceeded for anonymous users
        if (errorData.error === "Rate limit exceeded") {
          // Save pending generation
          sessionStorage.setItem(
            "PENDING_GENERATION", // Updated key
            JSON.stringify({
              prompt: genPrompt,
              referenceImages: genReferenceImages,
              numberOfImages: genNumberOfImages,
              aspectRatio: genAspectRatio,
              quality: genQuality,
            }),
          )
          // Show auth modal
          setShowAuthModal(true)

          // Clean up
          setLoading(false) // Renamed
          setProgress(0) // Renamed
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()

      // Smooth progress to 100%
      setProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const newResult = {
        id: data.generationId || Date.now().toString(),
        prompt: genPrompt,
        images: data.images.map((img: any) => ({
          dataUrl: img.url, // Storage URL
          url: img.url,
          mimeType: img.mimeType || "image/png",
        })),
        timestamp: Date.now(),
        aspectRatio: genAspectRatio,
        referenceImages: genReferenceImages.length > 0 ? genReferenceImages : undefined,
      }

      setResult(newResult)
      setDisplayResult(newResult)
      setHistory((prev) => {
        const updatedHistory = [newResult, ...prev]
        updatedHistory.sort((a, b) => b.timestamp - a.timestamp)

        if (!user) {
          localStorage.setItem(ANONYMOUS_HISTORY_KEY, JSON.stringify(updatedHistory))
        }

        return updatedHistory
      })
      setReferenceImages([])

      // No need for progressInterval as it's handled by useEffect
      setTimeout(() => {
        setProgress(0) // Reset progress after a short delay
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error("Generation error:", error)
      alert(error instanceof Error ? error.message : "Failed to generate image")
      setLoading(false) // Renamed
      setProgress(0) // Renamed
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      setUser(null)
      loadAnonymousHistory()
      setResult(null) // Clear result as well
      setDisplayResult(null)
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  const handleHistoryClick = (item: GenerationResult) => {
    setDisplayResult(item)
    setCurrentImageIndex(0)
    if (item.prompt) setPrompt(item.prompt)
    if (item.aspectRatio) setAspectRatio(item.aspectRatio)
    if (item.referenceImages) setReferenceImages(item.referenceImages)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? (displayResult?.images.length || 1) - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === (displayResult?.images.length || 1) - 1 ? 0 : prev + 1))
  }

  const handleUseAsInput = (dataUrl: string) => {
    if (referenceImages.length < 8) {
      setReferenceImages((prev) => [...prev, dataUrl])
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 8 - referenceImages.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          setReferenceImages((prev) => [...prev, dataUrl])
        }
        reader.readAsDataURL(file)
      }
    }

    e.target.value = ""
  }

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 8 - referenceImages.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          setReferenceImages((prev) => [...prev, dataUrl])
        }
        reader.readAsDataURL(file)
      }
    }

    e.target.value = ""
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index))
  }

  const hasMultipleImages = displayResult?.images && displayResult.images.length > 1

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full font-mono overflow-hidden relative">
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-primary rounded-lg p-8 bg-background/50">
            <p className="text-lg font-mono">Drop images to add to reference images</p>
            <p className="text-sm text-muted-foreground mt-2">{8 - referenceImages.length} slots remaining</p>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-background border border-border p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="font-mono text-lg font-medium">Sign in Required</h2>
              <p className="font-mono text-sm text-muted-foreground">
                You've used your free generation. Sign in with Vercel to continue generating images.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  window.location.href = "/api/auth/authorize"
                }}
                className="flex-1 font-mono text-sm"
              >
                <svg className="w-3 h-3 mr-2" viewBox="0 0 76 76" fill="none">
                  <path d="M38 0L76 76H0L38 0Z" fill="currentColor" />
                </svg>
                Sign in with Vercel
              </Button>
              <Button onClick={() => setShowAuthModal(false)} variant="outline" className="flex-1 font-mono text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage || "/placeholder.svg"}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close fullscreen"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-border overflow-hidden">
        <div className="flex flex-col gap-4 p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <h1 className="text-sm font-medium tracking-tight">FLUX.2 Playground</h1>
              <a
                href="https://vercel.com/ai-gateway/models/flux-2-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Powered by Vercel AI Gateway
              </a>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                      {user.picture && (
                        <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name || user.email} />
                      )}
                      <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {!user && !authLoading && (
            <div className="pt-2 border-t border-border">
              <Button
                onClick={() => (window.location.href = "/api/auth/authorize")}
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs h-8 gap-2 bg-transparent"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 76 76" fill="currentColor">
                  <polygon points="38,0 76,76 0,76" />
                </svg>
                Sign in with Vercel
              </Button>
            </div>
          )}
          {authLoading && (
            <div className="pt-2 border-t border-border">
              <div className="font-mono text-xs text-muted-foreground">Loading...</div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto border-b border-border min-h-0">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <p className="font-mono text-xs text-muted-foreground text-center">No history yet</p>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className={`flex gap-3 p-3 border-b border-border hover:bg-muted/50 transition-colors text-left relative group ${
                    displayResult === item ? "bg-muted" : ""
                  }`}
                >
                  {item.images[0]?.dataUrl && (
                    <div className="w-12 h-12 flex-shrink-0 border border-border bg-background overflow-hidden relative">
                      <img
                        src={item.images[0].dataUrl || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {item.images.length > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] font-mono px-1 py-0.5">
                          {item.images.length}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-foreground line-clamp-2">{item.prompt}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">{item.aspectRatio}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteGeneration(item.id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive p-1.5 rounded"
                    title="Delete generation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto border-t border-border flex-shrink-0">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-input" className="font-mono text-xs text-muted-foreground">
                Prompt
              </Label>
              <Textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                placeholder="A red balloon on a wooden table"
                className="font-mono text-sm resize-none min-h-[60px] lg:min-h-[80px]"
                disabled={loading}
              />
              <p className="font-mono text-xs text-muted-foreground">⌘ + Enter</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-images" className="font-mono text-xs text-muted-foreground">
                Reference Images (optional, max 8)
              </Label>
              <div className="flex flex-wrap gap-2">
                {referenceImages.map((img, index) => (
                  <div key={index} className="relative w-16 h-16 border border-border rounded overflow-hidden group">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeReferenceImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {referenceImages.length < 8 && (
                  <label
                    htmlFor="reference-images"
                    className="w-16 h-16 border border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-2xl text-muted-foreground">+</span>
                  </label>
                )}
              </div>
              <input
                id="reference-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading || referenceImages.length >= 8}
              />
              {referenceImages.length > 0 && (
                <p className="font-mono text-xs text-muted-foreground">{referenceImages.length}/8 reference images</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="image-count" className="font-mono text-xs text-muted-foreground">
                  Images
                </Label>
                <Select value={numberOfImages} onValueChange={(v) => setNumberOfImages(v)} disabled={loading}>
                  <SelectTrigger id="image-count" className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspect-ratio" className="font-mono text-xs text-muted-foreground">
                  Ratio
                </Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={loading}>
                  <SelectTrigger id="aspect-ratio" className="font-mono text-[10px] lg:text-xs h-7 lg:h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1" className="font-mono text-xs">
                      1:1
                    </SelectItem>
                    <SelectItem value="16:9" className="font-mono text-xs">
                      16:9
                    </SelectItem>
                    <SelectItem value="9:16" className="font-mono text-xs">
                      9:16
                    </SelectItem>
                    <SelectItem value="4:3" className="font-mono text-xs">
                      4:3
                    </SelectItem>
                    <SelectItem value="3:4" className="font-mono text-xs">
                      3:4
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality" className="font-mono text-xs text-muted-foreground">
                  Quality
                </Label>
                <Select value={quality} onValueChange={setQuality} disabled={loading}>
                  <SelectTrigger id="quality" className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard" className="font-mono text-xs">
                      Std
                    </SelectItem>
                    <SelectItem value="hd" className="font-mono text-xs">
                      HD
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full font-mono text-sm">
              {loading ? "Generating..." : "Generate"}
            </Button>

            {displayResult?.error && (
              <div className="p-3 border border-destructive/50 bg-destructive/10 text-destructive font-mono text-xs">
                {displayResult.error}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="hidden lg:flex lg:flex-1 bg-muted/20 relative items-center justify-center overflow-hidden min-h-0">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
            <div className="max-w-md w-full bg-background/95 backdrop-blur-sm border border-border p-4 space-y-2 pointer-events-auto">
              <Progress value={progress} className="h-1 transition-all duration-100" />
              <p className="font-mono text-xs text-muted-foreground text-center">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {!displayResult?.images ? (
          <p className="font-mono text-sm text-muted-foreground">Preview</p>
        ) : (
          <div className="w-full h-full relative">
            {hasMultipleImages && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-2 py-1 border border-border bg-background/95 backdrop-blur-sm">
                <span className="font-mono text-xs text-muted-foreground">View:</span>
                <button
                  onClick={() => setViewMode("single")}
                  className={`p-1 transition-colors ${
                    viewMode === "single" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Single view"
                >
                  <SquareIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-1 transition-colors ${
                    viewMode === "gallery" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Gallery view"
                >
                  <Grid2x2Icon className="w-4 h-4" />
                </button>
              </div>
            )}

            {viewMode === "single" ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 min-h-0">
                {displayResult.images[currentImageIndex]?.dataUrl && (
                  <div className="relative group max-w-full max-h-[calc(100%-6rem)] flex items-center justify-center">
                    <img
                      src={displayResult.images[currentImageIndex].dataUrl || "/placeholder.svg"}
                      alt={`Generated image ${currentImageIndex + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in"
                      loading="lazy"
                      onClick={() => setFullscreenImage(displayResult.images[currentImageIndex].dataUrl)}
                    />
                    <button
                      onClick={() => handleUseAsInput(displayResult.images[currentImageIndex].dataUrl)}
                      className="absolute top-2 right-2 px-3 py-1.5 font-mono text-xs border border-border bg-background/95 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                      disabled={referenceImages.length >= 8}
                    >
                      Use as Input
                    </button>
                  </div>
                )}
                {displayResult.images.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0">
                    <button
                      onClick={handlePrevImage}
                      className="px-4 py-2 font-mono text-xs border border-border bg-background hover:bg-muted transition-colors"
                    >
                      Previous
                    </button>
                    <p className="font-mono text-xs text-muted-foreground">
                      {currentImageIndex + 1} / {displayResult.images.length}
                    </p>
                    <button
                      onClick={handleNextImage}
                      className="px-4 py-2 font-mono text-xs border border-border bg-background hover:bg-muted transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                {displayResult.images.map((img, idx) => (
                  <div key={idx} className="relative group flex items-center justify-center min-h-0">
                    {img.dataUrl && (
                      <>
                        <img
                          src={img.dataUrl || "/placeholder.svg"}
                          alt={`Generated image ${idx + 1}`}
                          className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in"
                          loading="lazy"
                          onClick={() => setFullscreenImage(img.dataUrl)}
                        />
                        <button
                          onClick={() => handleUseAsInput(img.dataUrl)}
                          className="absolute top-2 right-2 px-2 py-1 font-mono text-xs border border-border bg-background/95 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                          disabled={referenceImages.length >= 8}
                        >
                          Use as Input
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="lg:hidden flex flex-col w-full h-full overflow-auto">
        {/* Header with title and sign in */}
        <div className="flex flex-col gap-4 p-4 border-b border-border flex-shrink-0 bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <h1 className="text-sm font-medium tracking-tight">FLUX.2 Playground</h1>
              <a
                href="https://vercel.com/ai-gateway/models/flux-2-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Powered by Vercel AI Gateway
              </a>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                      {user.picture && (
                        <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name || user.email} />
                      )}
                      <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {!user && !authLoading && (
            <div className="pt-2 border-t border-border">
              <Button
                onClick={() => (window.location.href = "/api/auth/authorize")}
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs h-8 gap-2 bg-transparent"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 76 76" fill="currentColor">
                  <polygon points="38,0 76,76 0,76" />
                </svg>
                Sign in with Vercel
              </Button>
            </div>
          )}
          {authLoading && (
            <div className="pt-2 border-t border-border">
              <div className="font-mono text-xs text-muted-foreground">Loading...</div>
            </div>
          )}
        </div>

        {/* Preview section - moved between header and form */}
        <div className="min-h-[50vh] bg-muted/20 relative flex items-center justify-center flex-shrink-0 border-b border-border">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
              <div className="max-w-md w-full bg-background/95 backdrop-blur-sm border border-border p-4 space-y-2 pointer-events-auto">
                <Progress value={progress} className="h-1 transition-all duration-100" />
                <p className="font-mono text-xs text-muted-foreground text-center">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {!displayResult?.images ? (
            <p className="font-mono text-sm text-muted-foreground">Preview</p>
          ) : (
            <div className="w-full h-full relative p-4">
              {hasMultipleImages && (
                <div className="absolute top-8 right-8 z-10 flex items-center gap-2 px-2 py-1 border border-border bg-background/95 backdrop-blur-sm">
                  <span className="font-mono text-xs text-muted-foreground">View:</span>
                  <button
                    onClick={() => setViewMode("single")}
                    className={`p-1 transition-colors ${
                      viewMode === "single" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Single view"
                  >
                    <SquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("gallery")}
                    className={`p-1 transition-colors ${
                      viewMode === "gallery" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Gallery view"
                  >
                    <Grid2x2Icon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {viewMode === "single" ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  {displayResult.images[currentImageIndex]?.dataUrl && (
                    <div className="relative group max-w-full flex items-center justify-center">
                      <img
                        src={displayResult.images[currentImageIndex].dataUrl || "/placeholder.svg"}
                        alt={`Generated image ${currentImageIndex + 1}`}
                        className="max-w-full w-auto h-auto object-contain cursor-zoom-in"
                        loading="lazy"
                        onClick={() => setFullscreenImage(displayResult.images[currentImageIndex].dataUrl)}
                      />
                      <button
                        onClick={() => handleUseAsInput(displayResult.images[currentImageIndex].dataUrl)}
                        className="absolute top-2 right-2 px-3 py-1.5 font-mono text-xs border border-border bg-background/95 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                        disabled={referenceImages.length >= 8}
                      >
                        Use as Input
                      </button>
                    </div>
                  )}
                  {displayResult.images.length > 1 && (
                    <div className="flex items-center justify-center gap-4 flex-shrink-0">
                      <button
                        onClick={handlePrevImage}
                        className="px-4 py-2 font-mono text-xs border border-border bg-background hover:bg-muted transition-colors"
                      >
                        Previous
                      </button>
                      <p className="font-mono text-xs text-muted-foreground">
                        {currentImageIndex + 1} / {displayResult.images.length}
                      </p>
                      <button
                        onClick={handleNextImage}
                        className="px-4 py-2 font-mono text-xs border border-border bg-background hover:bg-muted transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 w-full h-full">
                  {displayResult.images.map((img, idx) => (
                    <div key={idx} className="relative group flex items-center justify-center min-h-0">
                      {img.dataUrl && (
                        <>
                          <img
                            src={img.dataUrl || "/placeholder.svg"}
                            alt={`Generated image ${idx + 1}`}
                            className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in"
                            loading="lazy"
                            onClick={() => setFullscreenImage(img.dataUrl)}
                          />
                          <button
                            onClick={() => handleUseAsInput(img.dataUrl)}
                            className="absolute top-2 right-2 px-2 py-1 font-mono text-xs border border-border bg-background/95 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                            disabled={referenceImages.length >= 8}
                          >
                            Use as Input
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form section - moved after preview */}
        <div className="p-4 space-y-4 bg-background flex-shrink-0">
          <div className="space-y-2">
            <Label htmlFor="mobile-prompt" className="font-mono text-xs text-muted-foreground">
              Prompt
            </Label>
            <Textarea
              id="mobile-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
              placeholder="A red balloon on a wooden table"
              className="min-h-[100px] font-mono text-xs resize-none bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs text-muted-foreground">Reference Images (optional, max 8)</Label>
            <div className="grid grid-cols-4 gap-2">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square border border-border bg-muted/20">
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeReferenceImage(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center border border-border bg-background hover:bg-muted transition-colors"
                    aria-label="Remove image"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {referenceImages.length < 8 && (
                <label className="aspect-square border border-dashed border-border bg-muted/20 flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                  <PlusIcon className="w-4 h-4 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="mobile-images" className="font-mono text-xs text-muted-foreground">
                Images
              </Label>
              <Select value={numberOfImages} onValueChange={(val) => setNumberOfImages(val)} disabled={loading}>
                <SelectTrigger id="mobile-images" className="h-9 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-ratio" className="font-mono text-xs text-muted-foreground">
                Ratio
              </Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={loading}>
                <SelectTrigger id="mobile-ratio" className="font-mono text-xs h-8 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1:1", "16:9", "9:16", "4:3", "3:4"].map((ratio) => (
                    <SelectItem key={ratio} value={ratio} className="font-mono text-xs">
                      {ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-quality" className="font-mono text-xs text-muted-foreground">
                Quality
              </Label>
              <Select value={quality} onValueChange={setQuality} disabled={loading}>
                <SelectTrigger id="mobile-quality" className="font-mono text-xs h-8 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Std", "HD"].map((q) => (
                    <SelectItem key={q} value={q} className="font-mono text-xs">
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full font-mono text-xs h-9"
          >
            {!user ? "Sign in to Generate" : loading ? "Generating..." : "Generate"}
          </Button>
        </div>

        {/* History section - remains at bottom */}
        <div className="border-t border-border bg-background">
          <div className="p-4">
            <h2 className="font-mono text-xs text-muted-foreground mb-2">History</h2>
            {history.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-4">No history yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className={`flex gap-3 p-3 border border-border hover:bg-muted/50 transition-colors text-left relative group ${
                      displayResult === item ? "bg-muted" : ""
                    }`}
                  >
                    {item.images[0]?.dataUrl && (
                      <div className="w-16 h-16 flex-shrink-0 border border-border bg-background overflow-hidden relative">
                        <img
                          src={item.images[0].dataUrl || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {item.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] font-mono px-1 py-0.5">
                            {item.images.length}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-foreground line-clamp-2">{item.prompt}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">{item.aspectRatio}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteGeneration(item.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive p-1.5 rounded"
                      title="Delete generation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
