import ThemeSongGenerator from "@/components/ThemeSongGenerator"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Github, ExternalLink } from "lucide-react"
import { Toaster } from "@/components/ui/toast"

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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-balance">v0 Theme Song Generator</h2>
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
