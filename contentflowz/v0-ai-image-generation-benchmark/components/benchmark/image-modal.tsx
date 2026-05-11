"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

type ImageModalProps = {
  imageUrl: string | null
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (imageUrl) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [imageUrl, onClose])

  if (!imageUrl) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>
      <img
        src={imageUrl || "/placeholder.svg"}
        alt="Expanded view"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
