'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PlayerNames = {
  P1: string
  P2: string
  P3: string
  P4: string
}

const MATCHES = [
  { duoA: ['P1', 'P2'], duoB: ['P3', 'P4'] },
  { duoA: ['P1', 'P3'], duoB: ['P2', 'P4'] },
  { duoA: ['P1', 'P4'], duoB: ['P2', 'P3'] },
] as const

export default function Page() {
  const [playerNames, setPlayerNames] = useState<PlayerNames>({
    P1: 'Player 1',
    P2: 'Player 2',
    P3: 'Player 3',
    P4: 'Player 4',
  })
  
  const [matchIndex, setMatchIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  const currentMatch = MATCHES[matchIndex]
  const duoA = `${playerNames[currentMatch.duoA[0] as keyof PlayerNames]} × ${playerNames[currentMatch.duoA[1] as keyof PlayerNames]}`
  const duoB = `${playerNames[currentMatch.duoB[0] as keyof PlayerNames]} × ${playerNames[currentMatch.duoB[1] as keyof PlayerNames]}`

  const handleNext = () => {
    setMatchIndex((matchIndex + 1) % 3)
  }

  const handleNameChange = (key: keyof PlayerNames, value: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background font-mono relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,oklch(0.85_0.15_145)_2px,oklch(0.85_0.15_145)_4px)]" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 animate-pulse opacity-10 bg-primary" style={{ animationDuration: '3s' }} />

      <div className="w-full max-w-2xl relative z-20">
        {/* Terminal container */}
        <div className="border-2 border-primary relative shadow-[0_0_20px_rgba(34,197,94,0.3)] border-pulse">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-primary/20 blur-xl -z-10" />
          
          {/* Terminal header bar */}
          <div className="border-b-2 border-primary px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-primary" />
              <div className="w-3 h-3 border border-primary" />
              <div className="w-3 h-3 border border-primary" />
            </div>
            <div className="text-xs text-foreground tracking-widest">SYSTEM ACTIVE</div>
          </div>

          {/* Main content */}
          <div className="p-8 space-y-8 bg-background/95">
            {/* Header */}
            <div className="space-y-2 border-b border-primary/50 pb-4">
              <h1 className="text-3xl font-bold tracking-wider text-primary text-center animate-pulse" style={{ textShadow: '0 0 10px currentColor' }}>
                DUOS ROTATION SYSTEM
              </h1>
              <div className="text-center text-sm text-muted-foreground tracking-widest">
                EVERY RAIDER PLAYS WITH EVERY OTHER RAIDER
              </div>
            </div>

            {isEditing ? (
              <div className="border border-accent/70 p-6 space-y-4 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <div className="flex items-center justify-between border-b border-accent/30 pb-2">
                  <div className="text-lg text-accent font-bold tracking-widest">
                    {'>'} RAIDER ROSTER EDIT
                  </div>
                  <Button
                    onClick={() => setIsEditing(false)}
                    size="sm"
                    className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent font-bold tracking-wider text-xs"
                  >
                    DONE
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(playerNames) as Array<keyof PlayerNames>).map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-primary font-bold tracking-wider">
                        RAIDER {key.substring(1)}
                      </label>
                      <Input
                        value={playerNames[key]}
                        onChange={(e) => handleNameChange(key, e.target.value)}
                        className="bg-background/50 border-primary/50 text-foreground font-mono focus:border-primary focus:ring-primary/30"
                        style={{ textShadow: '0 0 5px currentColor' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent font-bold tracking-wider"
                >
                  EDIT NAMES
                </Button>
              </div>
            )}

            {/* Match display */}
            <div className="space-y-6 py-8">
              <div className="border border-primary/70 p-6 relative shadow-[0_0_15px_rgba(34,197,94,0.2)] border-pulse">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

                <div className="space-y-4">
                  <div className="text-xl text-accent font-bold tracking-widest border-b border-primary/30 pb-2">
                    {'>'} MATCH {matchIndex + 1}
                  </div>
                  
                  <div className="space-y-3 pl-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-primary font-bold text-lg">DUO A:</span>
                      <span className="text-foreground text-lg tracking-wide" style={{ textShadow: '0 0 5px currentColor' }}>
                        {duoA}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-3">
                      <span className="text-primary font-bold text-lg">DUO B:</span>
                      <span className="text-foreground text-lg tracking-wide" style={{ textShadow: '0 0 5px currentColor' }}>
                        {duoB}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-primary/30 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span className="tracking-wider">READY</span>
              </div>
              <div className="tracking-wider">
                MATCH {matchIndex + 1}/3
              </div>
            </div>

            {/* Next button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-primary/20 hover:bg-primary/30 text-primary border-2 border-primary font-bold tracking-widest px-8 py-6 text-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-200"
                style={{ textShadow: '0 0 5px currentColor' }}
              >
                NEXT MATCH ▶
              </Button>
            </div>
          </div>

          {/* Bottom terminal line */}
          <div className="border-t-2 border-primary px-4 py-2">
            <div className="text-xs text-muted-foreground tracking-widest text-center">
              █ CLASSIFIED OPERATIONS TERMINAL █
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
