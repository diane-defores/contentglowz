"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Skull } from "lucide-react"

export default function PodcastGenerator() {
  const [topic, setTopic] = useState("")
  const [script, setScript] = useState("")
  const [choices, setChoices] = useState<string[]>([])
  const [storyHistory, setStoryHistory] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
  }, [audioUrl])

  useEffect(() => {
    if (script && !audioUrl && !isGeneratingAudio) {
      generatePodcast()
    }
  }, [script])

  const generateScript = async () => {
    if (!topic.trim()) return

    setIsGeneratingScript(true)
    setAudioUrl("")
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error("Invalid response format from server")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate script")
      }

      setScript(data.script)
      setChoices(data.choices || [])
      setStoryHistory(data.script)
    } catch (error) {
      console.error("[v0] Error generating script:", error)
      alert(`Error generating script: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const continueStory = async (choice: string) => {
    setIsGeneratingScript(true)
    setAudioUrl("")
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          continueFrom: storyHistory,
          choice,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text)
        throw new Error("Invalid response format from server")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to continue story")
      }

      const newStory = storyHistory + "\n\n" + data.script
      setScript(data.script)
      setChoices(data.choices || [])
      setStoryHistory(newStory)
    } catch (error) {
      console.error("[v0] Error continuing story:", error)
      alert(`Error continuing story: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const generatePodcast = async () => {
    if (!script) return

    setIsGeneratingAudio(true)
    try {
      const response = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate podcast")
        }
        throw new Error(`HTTP ${response.status}: Failed to generate podcast`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (error) {
      console.error("Error generating podcast:", error)
      alert(`Error generating podcast: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Skull className="h-12 w-12 text-red-600" />
            <h1 className="text-5xl font-bold text-balance bg-gradient-to-r from-red-600 to-red-900 bg-clip-text text-transparent">
              Interactive True Crime
            </h1>
            <Skull className="h-12 w-12 text-red-600" />
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto text-pretty">
            Experience a dark, interactive true crime podcast where your choices shape the investigation. Featuring AI
            voices and atmospheric storytelling.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-red-600">Begin Your Investigation</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter a true crime topic to start your interactive podcast experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-zinc-300">
                Crime Case or Topic
              </Label>
              <Input
                id="topic"
                placeholder="e.g., The Vanishing of Sarah Mitchell, The Midnight Killer"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            <Button
              onClick={generateScript}
              disabled={!topic.trim() || isGeneratingScript}
              className="w-full bg-red-700 hover:bg-red-800 text-white"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Skull className="mr-2 h-4 w-4" />
                  Start Investigation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {script && isGeneratingAudio && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                <p className="text-zinc-400">Generating audio for this segment...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {audioUrl && (
          <>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-red-600">Listen Now</CardTitle>
                <CardDescription className="text-zinc-400">Your podcast segment is ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <audio ref={audioRef} controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>

                <details className="mt-4">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 text-sm">View Script</summary>
                  <Textarea
                    value={script}
                    readOnly
                    rows={8}
                    className="mt-2 font-mono text-sm bg-zinc-950 border-zinc-700 text-zinc-300"
                  />
                </details>
              </CardContent>
            </Card>

            {choices.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-red-600">What Happens Next?</CardTitle>
                  <CardDescription className="text-zinc-400">Choose how to continue the investigation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {choices.map((choice, index) => (
                    <Button
                      key={index}
                      onClick={() => continueStory(choice)}
                      disabled={isGeneratingScript}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-4 bg-zinc-950 border-zinc-700 hover:bg-zinc-800 hover:border-red-700 text-zinc-300"
                    >
                      <span className="font-bold text-red-600 mr-3">Option {index + 1}:</span>
                      <span className="text-pretty">{choice}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
