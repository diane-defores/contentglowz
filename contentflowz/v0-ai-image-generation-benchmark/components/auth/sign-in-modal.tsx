"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type SignInModalProps = {
  onClose: () => void
  currentGenerations?: Array<{
    prompt: string
    timestamp: number
    images: Array<{
      modelId: string
      modelName: string
      provider: string
      imageUrl: string | null
      duration: string
      durationMs: number
      cost: string
      success: boolean
      error?: string
    }>
  }>
}

export function SignInModal({ onClose, currentGenerations }: SignInModalProps) {
  const handleSignIn = () => {
    if (currentGenerations && currentGenerations.length > 0) {
      try {
        sessionStorage.setItem("saved_generations", JSON.stringify(currentGenerations))
      } catch (e) {
        console.error("Failed to save generations:", e)
      }
    }
    window.location.href = "/api/auth/login"
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div className="bg-card border border-border max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-medium mb-2">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground font-mono">
              You've used your free prompt. Sign in with Vercel to continue testing models.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignIn} className="w-full font-mono cursor-pointer" size="lg">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 1155 1000" fill="none">
                <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="currentColor" />
              </svg>
              Sign in with Vercel
            </Button>

            <p className="text-xs text-muted-foreground text-center">Free and unlimited access after signing in</p>
          </div>
        </div>
      </div>
    </div>
  )
}
