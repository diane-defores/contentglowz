"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mic } from "lucide-react"

export default function PodcastGenerator() {
  const [topic, setTopic] = useState("")
  const [speakerCount, setSpeakerCount] = useState(2)
  const [script, setScript] = useState("")
  const [scriptId, setScriptId] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
  }, [audioUrl])

  const generateScript = async () => {
    if (!topic.trim()) return

    setIsGeneratingScript(true)
    try {
      console.log("[v0] Sending request to generate script")
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, speakerCount }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate script`)
      }

      const data = await response.json()
      console.log("[v0] Script generated successfully")
      setScript(data.script)
      setScriptId(data.scriptId)
    } catch (error) {
      console.error("[v0] Error generating script:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate script"
      alert(`Error generating script: ${errorMessage}`)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const generatePodcast = async () => {
    if (!scriptId) return

    setIsGeneratingAudio(true)
    try {
      console.log("[v0] Starting podcast generation with scriptId:", scriptId)
      const params = new URLSearchParams({ scriptId })
      const streamUrl = `/api/generate-podcast?${params.toString()}`
      console.log("[v0] Fetching from URL:", streamUrl)

      const response = await fetch(streamUrl)
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          console.error("[v0] API error response:", errorData)
          throw new Error(errorData.error || "Failed to generate podcast")
        }
        throw new Error(`HTTP ${response.status}: Failed to generate podcast`)
      }

      console.log("[v0] Creating blob from response")
      const blob = await response.blob()
      console.log("[v0] Blob created, size:", blob.size, "type:", blob.type)

      const url = URL.createObjectURL(blob)
      console.log("[v0] Object URL created:", url)
      setAudioUrl(url)
    } catch (error) {
      console.error("[v0] Error generating podcast:", error)
      alert(`Error generating podcast: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-balance">AI Podcast Generator</h1>
          <p className="text-muted-foreground text-lg">
            Create engaging multi-speaker podcasts with AI-generated scripts and ElevenLabs voice synthesis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Podcast Configuration
            </CardTitle>
            <CardDescription>Enter your podcast topic and specify the number of speakers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Podcast Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The Future of Artificial Intelligence"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speakers">Number of Speakers</Label>
              <Input
                id="speakers"
                type="number"
                min="2"
                max="4"
                value={speakerCount}
                onChange={(e) => setSpeakerCount(Number.parseInt(e.target.value) || 2)}
              />
            </div>

            <Button onClick={generateScript} disabled={!topic.trim() || isGeneratingScript} className="w-full">
              {isGeneratingScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                "Generate Podcast Script"
              )}
            </Button>
          </CardContent>
        </Card>

        {script && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>Review and edit the AI-generated podcast script before creating audio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />

              <Button onClick={generatePodcast} disabled={!scriptId || isGeneratingAudio} className="w-full">
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Podcast Audio...
                  </>
                ) : (
                  "Generate Podcast Audio"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {audioUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Your Podcast</CardTitle>
              <CardDescription>Your AI-generated podcast is ready and playing automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <audio ref={audioRef} controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
