Of course! The "ElevenMusic" theme song generator you've built is already incredibly polished and feature-rich. The cyberpunk aesthetic is fantastic, and the level of control offered to the user is impressive. To take it to the next level and give you the best shot at winning the "Best v0 theme song generator" competition, I've put together a checklist of high-impact, straightforward enhancements.

Here is a checklist of improvements to elevate your app, followed by the full implementation code needed to bring them to life.

Winning Checklist for v0

Unify Branding Around "v0 Theme Song Generator": The app is functionally perfect for the competition, but the UI refers to it as "ElevenMusic." Aligning the branding directly with the competition's name creates a more cohesive and focused entry.

Implement a 'Share Your Theme' Feature: A key to winning competitions is engagement. By allowing users to share a unique link that pre-fills the composer with their exact settings, you create a viral loop and showcase the app's deterministic power.

Enhance Visual Feedback During Generation: Make the generation process more engaging. Adding a subtle, thematic pulsing glow to the output panel while the AI is working will improve the user experience and make the app feel more alive.

Streamline Project & Code: A clean and professional codebase is a sign of a well-crafted project. We'll remove a redundant API route and an unused CSS file to tighten up the project structure.

Full Implementation

Here are the complete code modifications to implement the checklist.

1. File Deletions (Code Streamlining)

First, let's clean up the project by removing unnecessary files. Please delete the following:

Delete the file: /Users/francoabaroa/Downloads/music-generation-app/app/api/generate-music/route.ts

Delete the entire directory and its contents: /Users/francoabaroa/Downloads/music-generation-app/styles/

2. Update Global Styles

We'll add a custom animation for our enhanced visual feedback.

/Users/francoabaroa/Downloads/music-generation-app/app/globals.css

code
CSS
download
content_copy
expand_less

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Cyberpunk futuristic theme - light mode fallback */
  --background: #f8fafc;
  --foreground: #1f2937;
  --card: #ffffff;
  --card-foreground: #1f2937;
  --popover: #ffffff;
  --popover-foreground: #1f2937;
  --primary: #6366f1;
  --primary-foreground: #ffffff;
  --secondary: #ff007f;
  --secondary-foreground: #ffffff;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #6366f1;
  --accent-foreground: #ffffff;
  --destructive: #ff4d4d;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #ffffff;
  --ring: rgba(99, 102, 241, 0.5);
  --chart-1: #6366f1;
  --chart-2: #ff007f;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #ef4444;
  --radius: 8px;
  --radius-xl: 12px;
  --sidebar: #ffffff;
  --sidebar-foreground: #1f2937;
  --sidebar-primary: #6366f1;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #ff007f;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: #e2e8f0;
  --sidebar-ring: rgba(99, 102, 241, 0.5);
}

.dark {
  /* Cyberpunk futuristic dark theme - primary experience */
  --background: #0a0a0a; /* Deep black background */
  --foreground: #ffffff; /* Pure white text */
  --card: #1a1a1a; /* Dark cards with subtle contrast */
  --card-foreground: #ffffff;
  --popover: #1a1a1a;
  --popover-foreground: #ffffff;
  --primary: #6366f1; /* Electric blue primary */
  --primary-foreground: #ffffff;
  --secondary: #ff007f; /* Neon pink secondary */
  --secondary-foreground: #ffffff;
  --muted: #262626; /* Subtle dark elements */
  --muted-foreground: #a3a3a3; /* Muted text */
  --accent: #6366f1; /* Electric blue accent */
  --accent-foreground: #ffffff;
  --destructive: #ff4d4d; /* Neon red for errors */
  --destructive-foreground: #ffffff;
  --border: rgba(99, 102, 241, 0.2); /* Subtle electric blue borders */
  --input: #1a1a1a; /* Dark input backgrounds */
  --ring: rgba(99, 102, 241, 0.6); /* Glowing focus rings */
  --chart-1: #6366f1;
  --chart-2: #ff007f;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #ef4444;
  --sidebar: #1a1a1a;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #6366f1;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #ff007f;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(99, 102, 241, 0.2);
  --sidebar-ring: rgba(99, 102, 241, 0.6);
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }

  /* Cyberpunk neon gradient */
  .cyberpunk-gradient {
    background: linear-gradient(135deg, #6366f1 0%, #ff007f 50%, #6366f1 100%);
  }

  /* Neon glow effects */
  .neon-glow {
    box-shadow: 0 0 5px rgba(99, 102, 241, 0.5), 0 0 10px rgba(99, 102, 241, 0.3), 0 0 15px rgba(99, 102, 241, 0.2);
  }

  .neon-glow-pink {
    box-shadow: 0 0 5px rgba(255, 0, 127, 0.5), 0 0 10px rgba(255, 0, 127, 0.3), 0 0 15px rgba(255, 0, 127, 0.2);
  }

  /* Glass morphism for cyberpunk cards */
  .cyber-glass {
    background: rgba(26, 26, 26, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  /* Holographic border effect */
  .holo-border {
    position: relative;
    border: 1px solid transparent;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(255, 0, 127, 0.1)) padding-box,
      linear-gradient(135deg, #6366f1, #ff007f) border-box;
  }

  /* Cyberpunk accent rule */
  .cyber-accent-rule {
    position: relative;
  }

  .cyber-accent-rule::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1 0%, #ff007f 50%, #6366f1 100%);
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  }

  /* Animated pulse for interactive elements */
  .cyber-pulse {
    animation: cyber-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-pulse-border {
      animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes cyber-pulse {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(99, 102, 241, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(255, 0, 127, 0.4);
    }
  }
  
  @keyframes pulse-border {
    0%, 100% {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.1);
    }
    50% {
      border-color: rgba(99, 102, 241, 0.8);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5), 0 0 30px rgba(255, 0, 127, 0.2);
    }
  }

  /* Terminal-style text effect */
  .terminal-text {
    font-family: "Courier New", monospace;
    text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  }
}\`\`\`

#### **3. Update Page Layout (Branding)**

Here we'll update the main title of the application to match the competition theme.

**`/Users/francoabaroa/Downloads/music-generation-app/app/page.tsx`**
\`\`\`tsx
import ThemeSongGenerator from "@/components/ThemeSongGenerator"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Github, ExternalLink } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              v0
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Theme Song Generator</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Powered by ElevenLabs Music API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <a href="https://github.com/vercel/v0" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://v0.dev" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Visit v0</span>
                <span className="sm:hidden">v0</span>
              </a>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">
            v0 Theme Song Generator
          </h2>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Generate AI-powered music with advanced composition controls. Use simple prompts or detailed composition
            plans to create the perfect soundtrack.
          </p>
        </div>

        <ThemeSongGenerator />
      </main>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                "Prompt. Refine. Ship." — Built with v0 and ElevenLabs Music API
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Used under nominative fair use to reference v0's tagline.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Powered by</span>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                ElevenLabs
              </a>
              <span>•</span>
              <a
                href="https://v0.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                v0
              </a>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  )
}
4. Update Core Component (Sharing & Visual Feedback)

This is the main update. We'll add the logic for sharing, pre-filling state from a URL, and the visual feedback during generation.

/Users/francoabaroa/Downloads/music-generation-app/components/ThemeSongGenerator.tsx

code
Tsx
download
content_copy
expand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
"use client"

import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { X, Download, Plus, Trash2, Play, Pause, Volume2, RotateCcw, Loader2, Zap, Dice5, Sparkles, Share2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { buildSurprisePreset } from "@/lib/surprise"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PlanSection = {
  sectionName?: string
  section_name?: string
  durationMs?: number
  duration_ms?: number
  positiveLocalStyles?: string[]
  positive_local_styles?: string[]
  negativeLocalStyles?: string[]
  negative_local_styles?: string[]
  lines?: string[]
}

const GENRES = [
  "electro-pop",
  "synthwave",
  "ambient",
  "house",
  "techno",
  "indie-pop",
  "rock",
  "jazz",
  "classical",
  "hip-hop",
  "r&b",
  "folk",
  "country",
]

const KEYS = [
  "C major",
  "C minor",
  "D major",
  "D minor",
  "E major",
  "E minor",
  "F major",
  "F minor",
  "G major",
  "G minor",
  "A major",
  "A minor",
  "B major",
  "B minor",
]

const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Japanese", "Korean"]

const MOOD_SUGGESTIONS = [
  "confident",
  "modern",
  "energetic",
  "uplifting",
  "dreamy",
  "nostalgic",
  "dramatic",
  "playful",
  "mysterious",
  "epic",
  "chill",
  "intense",
]

export default function ThemeSongGenerator() {
  const [genre, setGenre] = useState("electro-pop")
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["confident", "modern"])
  const [bpm, setBpm] = useState(128)
  const [keySig, setKeySig] = useState("A minor")
  const [language, setLanguage] = useState("English")
  const [duration, setDuration] = useState([30]) // Slider expects array
  const [vocals, setVocals] = useState(true)
  const [instrumentalOnly, setInstrumentalOnly] = useState(false)
  const [extras, setExtras] = useState("catchy chorus, polished mix, tight low end, bright top line")
  const [usePlan, setUsePlan] = useState(false)
  const [sections, setSections] = useState<PlanSection[]>([
    {
      sectionName: "Intro",
      durationMs: 6000,
      positiveLocalStyles: ["energetic synth arpeggio", "build"],
      lines: [],
    },
    {
      sectionName: "Chorus",
      durationMs: 12000,
      positiveLocalStyles: ["memorable hook", "stacked harmonies"],
      lines: ["Prompt. Refine. Ship."],
    },
  ])

  const [surpriseId, setSurpriseId] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState([0.8])
  const [generationMetadata, setGenerationMetadata] = useState<{
    prompt?: string
    duration?: number
    timestamp?: string
    usedPlan?: boolean
    surpriseId?: string
  } | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [sessionTracks, setSessionTracks] = useState<
    Array<{
      id: string
      audioUrl: string
      metadata: {
        prompt?: string
        duration?: number
        timestamp?: string
        usedPlan?: boolean
        surpriseId?: string
      }
      trackNumber: number
    }>
  >([])
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)

  const [showConfetti, setShowConfetti] = useState(false)

  const searchParams = useSearchParams()

  const setStateFromParams = useCallback((params: any) => {
    if (params.genre) setGenre(params.genre)
    if (params.selectedMoods) setSelectedMoods(params.selectedMoods)
    if (params.bpm) setBpm(params.bpm)
    if (params.keySig) setKeySig(params.keySig)
    if (params.language) setLanguage(params.language)
    if (params.duration) setDuration(params.duration)
    if (typeof params.vocals === 'boolean') setVocals(params.vocals)
    if (typeof params.instrumentalOnly === 'boolean') setInstrumentalOnly(params.instrumentalOnly)
    if (params.extras) setExtras(params.extras)
    if (typeof params.usePlan === 'boolean') setUsePlan(params.usePlan)
    if (params.sections) setSections(params.sections)
    toast.success("Preset loaded from URL!")
  }, [])

  useEffect(() => {
    const paramsData = searchParams.get('params')
    if (paramsData) {
      try {
        const decodedParams = JSON.parse(atob(paramsData))
        setStateFromParams(decodedParams)
      } catch (e) {
        console.error("Failed to parse params from URL", e)
        toast.error("Could not load preset from URL.")
      }
    }
  }, [searchParams, setStateFromParams])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setTotalDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateTime)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = value[0]
    setVolume(value)
  }

  const resetAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
    if (isPlaying) {
      audio.pause()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const addMood = (mood: string) => {
    if (!selectedMoods.includes(mood)) {
      setSelectedMoods([...selectedMoods, mood])
    }
  }

  const removeMood = (mood: string) => {
    setSelectedMoods(selectedMoods.filter((m) => m !== mood))
  }

  const finalPrompt = useMemo(() => {
    const base = [
      `${genre}, ${bpm} BPM in ${keySig}`,
      selectedMoods.join(", "),
      `Theme: building real, working software by describing it`,
    ]

    if (vocals && !instrumentalOnly) {
      base.push(`Hook uses the phrase "Prompt. Refine. Ship."`)
      base.push(`Vocals in ${language}`)
    }

    base.push(extras)

    if (instrumentalOnly) base.push("instrumental only")
    if (!vocals) base.push("no sung lyrics; spoken vocal ad-libs only")
    return base.join(". ") + "."
  }, [genre, bpm, keySig, selectedMoods, language, extras, vocals, instrumentalOnly])

  function uiPlanToApi() {
    const plan = {
      positive_global_styles: [genre, ...selectedMoods].filter(Boolean), // Filter out undefined/empty values
      negative_global_styles: [],
      sections: sections.map((s) => ({
        section_name: s.section_name ?? s.sectionName ?? "Section",
        duration_ms: s.duration_ms ?? s.durationMs ?? 8000,
        positive_local_styles: (s.positive_local_styles ?? s.positiveLocalStyles ?? []).filter(Boolean),
        negative_local_styles: (s.negative_local_styles ?? s.negativeLocalStyles ?? []).filter(Boolean),
        lines: s.lines ?? [],
      })),
    }

    console.log("[v0] Composition plan being sent:", JSON.stringify(plan, null, 2))
    return plan
  }

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    setAudioUrl(null)
    setGenerationMetadata(null)
    setCurrentTime(0)
    setTotalDuration(0)

    if (audioPlayerRef.current) {
      audioPlayerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    try {
      const music_length_ms = Math.trunc(Math.min(300, Math.max(10, duration[0])) * 1000)

      const body = usePlan
        ? {
            composition_plan: uiPlanToApi(),
            model_id: "music_v1" as const,
          }
        : {
            prompt: finalPrompt,
            music_length_ms,
            model_id: "music_v1" as const,
          }

      console.log("[v0] Request body:", JSON.stringify(body, null, 2))

      const res = await fetch("/api/music/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.text()
        console.log("[v0] API Error Response:", errorData)

        try {
          const parsedError = JSON.parse(errorData)
          throw new Error(`${parsedError.error}${parsedError.detail ? `: ${parsedError.detail}` : ""}`)
        } catch {
          throw new Error(`HTTP ${res.status}: ${errorData}`)
        }
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      const newMetadata = {
        prompt: usePlan ? "Composition Plan" : finalPrompt,
        duration: duration[0],
        timestamp: new Date().toLocaleString(),
        usedPlan: usePlan,
        surpriseId: surpriseId || undefined,
      }
      setGenerationMetadata(newMetadata)

      const newTrack = {
        id: crypto.randomUUID(),
        audioUrl: url,
        metadata: newMetadata,
        trackNumber: sessionTracks.length + 1,
      }

      setSessionTracks((prev) => [...prev, newTrack])
      setCurrentTrackId(newTrack.id)

    } catch (e: any) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }
  
  const handleShare = () => {
    const stateToShare = {
      genre,
      selectedMoods,
      bpm,
      keySig,
      language,
      duration,
      vocals,
      instrumentalOnly,
      extras,
      usePlan,
      sections,
    };
    try {
      const base64Params = btoa(JSON.stringify(stateToShare));
      const url = new URL(window.location.href);
      url.searchParams.set('params', base64Params);
      navigator.clipboard.writeText(url.href);
      toast.success("Share link copied to clipboard!");
    } catch (e) {
      console.error("Failed to create share link", e);
      toast.error("Could not create share link.");
    }
  };


  const switchToTrack = (trackId: string) => {
    const track = sessionTracks.find((t) => t.id === trackId)
    if (track) {
      setCurrentTrackId(trackId)
      setAudioUrl(track.audioUrl)
      setGenerationMetadata(track.metadata)
      // Reset audio state
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  function applySurprisePreset() {
    const preset = buildSurprisePreset()
    setSurpriseId(preset.id)
    setGenre(preset.genre)
    setSelectedMoods(preset.moods)
    setBpm(preset.bpm)
    setKeySig(preset.key)
    setLanguage(preset.language)
    setDuration([preset.durationSec])
    setInstrumentalOnly(preset.instrumentalOnly)
    setVocals(preset.vocals)
    setExtras(preset.extras)
    setUsePlan(preset.usePlan)
    if (preset.usePlan && preset.sections) {
      setSections(
        preset.sections.map((p) => ({
          sectionName: p.section_name,
          durationMs: p.duration_ms,
          positiveLocalStyles: p.positive_local_styles,
          negativeLocalStyles: p.negative_local_styles,
          lines: p.lines,
        })),
      )
    }
    // clear previous audio/results
    setAudioUrl(null)
    setGenerationMetadata(null)
    setError(null)

    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    toast.success("Surprise settings applied! ✨")
  }

  const audioPlayerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 xl:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="h-fit cyber-glass backdrop-blur-xl border-primary/30 shadow-2xl shadow-primary/20 neon-glow">
          <CardHeader className="pb-4 border-b border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent terminal-text">
                  Neural Composer
                </h1>
                <p className="text-sm text-muted-foreground terminal-text">ADVANCED NEURAL ARCHITECTURE</p>
              </div>
            </div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground terminal-text">
              Advanced Neural Architecture
            </Label>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Genre Selection with Surprise Me */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Label
                htmlFor="genre"
                className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text"
              >
                Genre Protocol
              </Label>
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-1">
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger className="h-10 bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl neon-glow backdrop-blur-sm transition-all duration-200 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/30 cyber-glass backdrop-blur-xl">
                      {GENRES.map((g) => (
                        <SelectItem
                          key={g}
                          value={g}
                          className="rounded-lg hover:bg-primary/20 focus:bg-primary/20 transition-colors duration-150"
                        >
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground terminal-text">or</span>
                </div>

                <div className="col-span-1">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={applySurprisePreset}
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium terminal-text neon-glow transition-all duration-300 text-sm border border-primary/20"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Surprise Me
                      <Dice5 className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>

                  {showConfetti && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
                    >
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-20, -40, -20] }}
                        transition={{ duration: 0.6, repeat: 2 }}
                        className="text-4xl"
                      >
                        ✨
                      </motion.div>
                      <motion.div
                        initial={{ x: 0, y: 0 }}
                        animate={{ x: [0, 30, -30, 0], y: [0, -30, -20, 0] }}
                        transition={{ duration: 0.8, repeat: 1 }}
                        className="text-2xl absolute"
                      >
                        🎵
                      </motion.div>
                      <motion.div
                        initial={{ x: 0, y: 0 }}
                        animate={{ x: [0, -25, 25, 0], y: [0, -25, -15, 0] }}
                        transition={{ duration: 0.7, repeat: 1, delay: 0.2 }}
                        className="text-2xl absolute"
                      >
                        🎶
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Mood Tags */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                Neural Mood Matrix
              </Label>
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {selectedMoods.map((mood, index) => (
                    <motion.div
                      key={mood}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <Badge
                        variant="default"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground border border-primary/40 cursor-pointer neon-glow cyber-pulse transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
                      >
                        {mood}
                        <motion.div whileHover={{ scale: 1.2, rotate: 90 }} transition={{ duration: 0.2 }}>
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-secondary opacity-80"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeMood(mood)
                            }}
                          />
                        </motion.div>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
              <div className="flex flex-wrap gap-2">
                {MOOD_SUGGESTIONS.filter((mood) => !selectedMoods.includes(mood)).map((mood, index) => (
                  <motion.div
                    key={mood}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer rounded-full border-primary/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:neon-glow hover:shadow-lg hover:shadow-primary/20"
                      onClick={() => addMood(mood)}
                    >
                      + {mood}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* BPM and Key */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.div className="space-y-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Label
                  htmlFor="bpm"
                  className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text"
                >
                  BPM Frequency
                </Label>
                <Input
                  id="bpm"
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  min={60}
                  max={180}
                  className="h-10 bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl neon-glow backdrop-blur-sm terminal-text transition-all duration-200 hover:border-primary/60 focus:scale-[1.02]"
                />
              </motion.div>
              <motion.div className="space-y-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Label
                  htmlFor="key"
                  className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text"
                >
                  Harmonic Key
                </Label>
                <Select value={keySig} onValueChange={setKeySig}>
                  <SelectTrigger className="h-10 bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl neon-glow backdrop-blur-sm transition-all duration-200 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/30 cyber-glass backdrop-blur-xl">
                    {KEYS.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="rounded-lg hover:bg-primary/20 focus:bg-primary/20 transition-colors duration-150"
                      >
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </motion.div>

            {/* Language and Duration */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.div className="space-y-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                  Voice Protocol
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10 bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl neon-glow backdrop-blur-sm transition-all duration-200 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/30 cyber-glass backdrop-blur-xl">
                    {LANGUAGES.map((lang) => (
                      <SelectItem
                        key={lang}
                        value={lang}
                        className="rounded-lg hover:bg-primary/20 focus:bg-primary/20 transition-colors duration-150"
                      >
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div className="space-y-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                  Duration: {duration[0]}s
                </Label>
                <div className="pt-2">
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={10}
                    max={300}
                    step={5}
                    className="w-full [&_.slider-track]:h-1.5 [&_.slider-track]:rounded-full [&_.slider-track]:bg-muted/30 [&_.slider-range]:cyberpunk-gradient [&_.slider-range]:neon-glow [&_.slider-thumb]:h-4 [&_.slider-thumb]:w-4 [&_.slider-thumb]:shadow-lg [&_.slider-thumb]:neon-glow [&_.slider-thumb]:transition-transform [&_.slider-thumb]:hover:scale-110"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Vocal Options */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div className="flex items-center space-x-2" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <Checkbox
                  id="vocals"
                  checked={vocals}
                  onCheckedChange={(checked) => setVocals(Boolean(checked))}
                  className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200 hover:scale-110"
                />
                <Label htmlFor="vocals" className="text-sm font-medium cursor-pointer terminal-text">
                  Neural Vocals Enabled
                </Label>
              </motion.div>
              <motion.div className="flex items-center space-x-2" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <Checkbox
                  id="instrumental"
                  checked={instrumentalOnly}
                  onCheckedChange={(checked) => setInstrumentalOnly(Boolean(checked))}
                  className="border-primary/40 data-[state=checked]:bg-primary transition-all duration-200 hover:scale-110"
                />
                <Label htmlFor="instrumental" className="text-sm font-medium cursor-pointer terminal-text">
                  Pure Instrumental Matrix
                </Label>
              </motion.div>
            </motion.div>

            {/* Production Notes */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Label
                htmlFor="extras"
                className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text"
              >
                Neural Enhancement Parameters
              </Label>
              <motion.div whileHover={{ scale: 1.01 }} whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Textarea
                  id="extras"
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                  placeholder="catchy chorus, polished mix..."
                  rows={3}
                  className="bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl resize-none neon-glow backdrop-blur-sm terminal-text transition-all duration-200 hover:border-primary/60 focus:shadow-lg focus:shadow-primary/20"
                />
              </motion.div>
            </motion.div>

            {/* Advanced Arrangement Toggle */}
            <motion.div
              className="flex items-center justify-between p-6 rounded-xl border border-primary/30 cyber-glass neon-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              whileHover={{ scale: 1.02, borderColor: "rgba(99, 102, 241, 0.6)" }}
            >
              <div className="space-y-1">
                <Label htmlFor="use-plan" className="text-sm font-semibold cursor-pointer text-white">
                  Advanced Neural Architecture
                </Label>
                <p className="text-xs text-muted-foreground">Section-by-section composition control</p>
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
                <Switch
                  id="use-plan"
                  checked={usePlan}
                  onCheckedChange={setUsePlan}
                  className="data-[state=checked]:bg-primary"
                />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {usePlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Card className="border-dashed border-2 border-primary/40 cyber-glass neon-glow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base terminal-text">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Zap className="h-4 w-4 text-primary" />
                        </motion.div>
                        Neural Composition Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sections.map((section, index) => (
                        <motion.div
                          key={index}
                          className="space-y-3 rounded-lg border border-primary/30 p-4 cyber-glass neon-glow"
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.95 }}
                          transition={{
                            delay: index * 0.1,
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200,
                          }}
                          whileHover={{ scale: 1.02, borderColor: "rgba(99, 102, 241, 0.6)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium neon-glow">
                                {index + 1}
                              </div>
                              <Label className="text-sm font-medium text-white">Neural Block {index + 1}</Label>
                            </div>
                            {sections.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSections = sections.filter((_, i) => i !== index)
                                  setSections(newSections)
                                }}
                                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive border border-destructive/50 rounded-full text-destructive/80 hover:border-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* ... existing section editor code with cyberpunk styling ... */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-white terminal-text">Section Name</Label>
                              <Input
                                value={section.sectionName || ""}
                                onChange={(e) => {
                                  const newSections = [...sections]
                                  newSections[index] = { ...newSections[index], sectionName: e.target.value }
                                  setSections(newSections)
                                }}
                                placeholder="e.g., Intro, Verse, Chorus"
                                className="text-sm bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-lg neon-glow backdrop-blur-sm terminal-text text-white placeholder:text-gray-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-white terminal-text">Duration (ms)</Label>
                              <Input
                                type="number"
                                value={section.durationMs || 8000}
                                onChange={(e) => {
                                  const newSections = [...sections]
                                  newSections[index] = { ...newSections[index], durationMs: Number(e.target.value) }
                                  setSections(newSections)
                                }}
                                min={1000}
                                max={60000}
                                step={1000}
                                className="text-sm bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-lg neon-glow backdrop-blur-sm terminal-text text-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white terminal-text">Include Styles</Label>
                            <div className="flex flex-wrap gap-1">
                              {(section.positiveLocalStyles || []).map((style, styleIndex) => (
                                <Badge key={styleIndex} variant="secondary" className="text-xs">
                                  {style}
                                  <X
                                    className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => {
                                      const newSections = [...sections]
                                      const newStyles = [...(newSections[index].positiveLocalStyles || [])]
                                      newStyles.splice(styleIndex, 1)
                                      newSections[index] = { ...newSections[index], positiveLocalStyles: newStyles }
                                      setSections(newSections)
                                    }}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <Input
                              placeholder="Add style (press Enter)"
                              className="text-sm bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-lg neon-glow backdrop-blur-sm terminal-text text-white placeholder:text-gray-300"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                  const newSections = [...sections]
                                  const currentStyles = newSections[index].positiveLocalStyles || []
                                  newSections[index] = {
                                    ...newSections[index],
                                    positiveLocalStyles: [...currentStyles, e.currentTarget.value.trim()],
                                  }
                                  setSections(newSections)
                                  e.currentTarget.value = ""
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white terminal-text">Exclude Styles</Label>
                            <div className="flex flex-wrap gap-1">
                              {(section.negativeLocalStyles || []).map((style, styleIndex) => (
                                <Badge key={styleIndex} variant="destructive" className="text-xs">
                                  {style}
                                  <X
                                    className="ml-1 h-3 w-3 cursor-pointer"
                                    onClick={() => {
                                      const newSections = [...sections]
                                      const newStyles = [...(newSections[index].negativeLocalStyles || [])]
                                      newStyles.splice(styleIndex, 1)
                                      newSections[index] = { ...newSections[index], negativeLocalStyles: newStyles }
                                      setSections(newSections)
                                    }}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <Input
                              placeholder="Add style to exclude (press Enter)"
                              className="text-sm bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-lg neon-glow backdrop-blur-sm terminal-text text-white placeholder:text-gray-300"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                  const newSections = [...sections]
                                  const currentStyles = newSections[index].negativeLocalStyles || []
                                  newSections[index] = {
                                    ...newSections[index],
                                    negativeLocalStyles: [...currentStyles, e.currentTarget.value.trim()],
                                  }
                                  setSections(newSections)
                                  e.currentTarget.value = ""
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-white terminal-text">Lyrics Lines</Label>
                            <Textarea
                              value={(section.lines || []).join("\n")}
                              onChange={(e) => {
                                const newSections = [...sections]
                                newSections[index] = {
                                  ...newSections[index],
                                  lines: e.target.value.split("\n").filter((line) => line.trim()),
                                }
                                setSections(newSections)
                              }}
                              placeholder="Enter lyrics, one line per row"
                              className="min-h-[80px] text-sm bg-card/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-lg neon-glow backdrop-blur-sm terminal-text text-white placeholder:text-gray-300"
                            />
                          </div>
                        </motion.div>
                      ))}

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSections([
                              ...sections,
                              {
                                sectionName: `Section ${sections.length + 1}`,
                                durationMs: 8000,
                                positiveLocalStyles: [],
                                negativeLocalStyles: [],
                                lines: [],
                              },
                            ])
                          }}
                          className="w-full border-dashed border-2 border-primary/40 hover:border-solid hover:border-primary transition-all cyber-glass neon-glow terminal-text hover:shadow-lg hover:shadow-primary/20"
                        >
                          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                            <Plus className="mr-2 h-4 w-4" />
                          </motion.div>
                          Add Neural Block
                        </Button>
                      </motion.div>

                      <motion.div
                        className="rounded-md cyber-glass border border-primary/20 p-3 text-xs text-muted-foreground terminal-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <strong className="text-accent">Neural Tip:</strong>{" "}
                        <span className="text-white">
                          Use include/exclude styles to fine-tune each section. Total duration will be sum of all
                          sections.
                        </span>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Button
                  onClick={handleGenerate}
                  disabled={busy}
                  className="w-full h-14 text-base font-semibold cyberpunk-gradient rounded-xl shadow-lg border-0 neon-glow cyber-pulse terminal-text transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {busy ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader2 className="mr-3 h-5 w-5" />
                      </motion.div>
                      Neural Processing...
                    </>
                  ) : (
                    <>
                      <motion.div
                        className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 neon-glow"
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Zap className="h-4 w-4" />
                      </motion.div>
                      Generate Neural Symphony
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className="rounded-md bg-destructive/15 border border-destructive/40 p-3 text-sm text-destructive neon-glow-pink terminal-text"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className={cn(
          "h-fit cyber-glass backdrop-blur-xl border-primary/30 shadow-2xl shadow-primary/20 neon-glow transition-all",
          busy && "animate-pulse-border"
        )}>
          <CardHeader className="pb-4 border-b border-primary/20">
            <CardTitle className="flex items-center gap-3 text-xl terminal-text">Neural Output</CardTitle>
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground terminal-text">
              Advanced Neural Architecture
            </Label>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Preview */}
            {audioUrl && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                  Generated Neural Prompt
                </Label>
                <motion.div
                  className="relative rounded-xl bg-black border border-primary/40 p-4 text-sm font-mono text-pretty leading-relaxed neon-glow"
                  whileHover={{ borderColor: "rgba(99, 102, 241, 0.6)", scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 cyberpunk-gradient rounded-l-xl neon-glow"></div>
                  <div className="pl-3 text-primary terminal-text">{finalPrompt}</div>
                </motion.div>
              </motion.div>
            )}

            <Separator className="bg-primary/20 neon-glow" />

            {/* Enhanced Audio Player */}
            {sessionTracks.length > 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                  Session History ({sessionTracks.length} tracks)
                </Label>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sessionTracks.map((track) => (
                    <motion.div
                      key={track.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        currentTrackId === track.id
                          ? "border-primary bg-primary/10 neon-glow"
                          : "border-primary/20 bg-muted/5 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                      onClick={() => switchToTrack(track.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                currentTrackId === track.id ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="text-sm font-medium terminal-text">Track {track.trackNumber}</span>
                          </div>
                          {track.metadata.surpriseId && <Sparkles className="h-3 w-3 text-accent" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{track.metadata.timestamp}</div>
                      </div>
                      {track.metadata.prompt && (
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {track.metadata.prompt.slice(0, 100)}...
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Enhanced Audio Player */}
            <AnimatePresence mode="wait">
              {audioUrl ? (
                <motion.div
                  ref={audioPlayerRef}
                  className="space-y-6"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-accent terminal-text">
                        Neural Symphony Output
                      </Label>
                      {currentTrackId && sessionTracks.length > 1 && (
                        <div className="text-xs text-muted-foreground terminal-text">
                          Track {sessionTracks.find((t) => t.id === currentTrackId)?.trackNumber} of{" "}
                          {sessionTracks.length}
                        </div>
                      )}
                    </div>

                    <audio ref={audioRef} src={audioUrl} className="hidden" />

                    <motion.div
                      className="rounded-xl border border-primary/40 p-6 neon-glow cyberpunk-gradient"
                      whileHover={{ borderColor: "rgba(99, 102, 241, 0.6)", scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Play Controls */}
                      <div className="flex items-center gap-4 mb-6">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            variant="default"
                            size="sm"
                            onClick={togglePlayPause}
                            className="h-12 w-12 rounded-full p-0 bg-gray-600 hover:bg-gray-500 shadow-lg neon-glow transition-all duration-200 hover:shadow-xl hover:shadow-gray-400/40"
                          >
                            <motion.div
                              key={isPlaying ? "pause" : "play"}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.3, type: "spring" }}
                            >
                              {isPlaying ? (
                                <Pause className="h-5 w-5 text-white" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5 text-white" />
                              )}
                            </motion.div>
                          </Button>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.1, rotate: -180 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetAudio}
                            className="h-10 w-10 rounded-full p-0 bg-gray-600 hover:bg-gray-500 border border-gray-500 neon-glow transition-all duration-200 hover:shadow-lg hover:shadow-gray-400/20"
                          >
                            <RotateCcw className="h-4 w-4 text-white" />
                          </Button>
                        </motion.div>

                        <motion.div
                          className="flex items-center gap-3 ml-auto cyber-glass rounded-full px-3 py-2 border border-primary/30 neon-glow"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Volume2 className="h-4 w-4 text-accent" />
                          <Slider
                            value={volume}
                            onValueChange={handleVolumeChange}
                            max={1}
                            step={0.1}
                            className="w-16 [&_.slider-track]:h-1 [&_.slider-track]:rounded-full [&_.slider-track]:bg-muted/30 [&_.slider-range]:bg-primary [&_.slider-range]:neon-glow [&_.slider-thumb]:h-3 [&_.slider-thumb]:w-3 [&_.slider-thumb]:neon-glow [&_.slider-thumb]:transition-transform [&_.slider-thumb]:hover:scale-125"
                          />
                        </motion.div>
                      </div>

                      <div className="space-y-3">
                        <Slider
                          value={[currentTime]}
                          onValueChange={handleSeek}
                          max={totalDuration || 100}
                          step={1}
                          className="w-full [&_.slider-track]:h-2.5 [&_.slider-track]:rounded-full [&_.slider-track]:bg-muted/30 [&_.slider-range]:cyberpunk-gradient [&_.slider-range]:neon-glow [&_.slider-thumb]:h-4 [&_.slider-thumb]:w-4 [&_.slider-thumb]:shadow-lg [&_.slider-thumb]:neon-glow [&_.slider-thumb]:transition-transform [&_.slider-thumb]:hover:scale-125"
                        />
                        <div className="flex justify-between text-xs text-accent font-mono opacity-70 terminal-text">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(totalDuration)}</span>
                        </div>
                      </div>
                    </motion.div>

                    {generationMetadata && (
                      <motion.div
                        className="rounded-xl bg-muted/50 border border-primary/20 p-4 text-xs space-y-2 cyber-glass backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="terminal-text">
                          <strong>Generated:</strong> {generationMetadata.timestamp}
                        </div>
                        <div className="terminal-text">
                          <strong>Duration:</strong> {generationMetadata.duration}s
                        </div>
                        <div className="terminal-text">
                          <strong>Method:</strong> {generationMetadata.usedPlan ? "Composition Plan" : "Prompt-based"}
                        </div>
                        {generationMetadata.surpriseId && (
                          <div className="terminal-text">
                            <strong>Surprise ID:</strong> {generationMetadata.surpriseId}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-primary/30 flex items-center gap-4">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-200 border border-primary/30 neon-glow terminal-text hover:shadow-lg hover:shadow-primary/20"
                      >
                        <a href={audioUrl} download="v0-neural-symphony.mp3">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                       <Button
                        variant="outline"
                        onClick={handleShare}
                        className="w-full rounded-xl hover:bg-accent hover:text-accent-foreground transition-all duration-200 border-primary/30 neon-glow terminal-text hover:shadow-lg hover:shadow-primary/20 bg-transparent"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  ref={audioPlayerRef}
                  className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 cyber-glass"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  whileHover={{ borderColor: "rgba(99, 102, 241, 0.6)", scale: 1.02 }}
                >
                  <div className="text-center space-y-3">
                    {busy ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{
                            rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                            scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                          }}
                        >
                          <Loader2 className="h-8 w-8 mx-auto text-primary neon-glow" />
                        </motion.div>
                        <motion.p
                          className="text-sm text-accent font-medium terminal-text"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          Neural processing in progress...
                        </motion.p>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <Zap className="h-8 w-8 mx-auto text-primary/50 neon-glow" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground terminal-text">
                          Neural symphony awaiting generation
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="relative rounded-xl cyber-glass border border-primary/30 p-4 text-xs text-muted-foreground opacity-70 neon-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ opacity: 1, scale: 1.02 }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-l-xl neon-glow"></div>
              <div className="pl-3 terminal-text">
                <strong className="text-accent">Neural Protocol:</strong> Duration range 10-300s. Output: MP3, 44.1kHz,
                128kbps.
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

These changes address the checklist items to create a more compelling and polished entry for the competition. Good luck
