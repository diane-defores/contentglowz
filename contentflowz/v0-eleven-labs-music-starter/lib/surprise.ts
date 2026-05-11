// /lib/surprise.ts
export type PlanSection = {
  section_name: string
  duration_ms: number
  positive_local_styles: string[]
  negative_local_styles: string[]
  lines: string[]
}

export type SurprisePreset = {
  id: string
  genre: string
  moods: string[]
  bpm: number
  key: string
  language: string
  durationSec: number
  vocals: boolean
  instrumentalOnly: boolean
  extras: string
  usePlan: boolean
  sections?: PlanSection[]
}

const GENRE_BPM: Record<string, [number, number]> = {
  "electro-pop": [96, 128],
  synthwave: [80, 118],
  ambient: [60, 90],
  house: [118, 128],
  techno: [124, 135],
  "indie-pop": [90, 120],
  rock: [80, 140],
  jazz: [80, 160],
  classical: [60, 130],
  "hip-hop": [80, 100],
  "r&b": [70, 100],
  folk: [70, 120],
  country: [70, 120],
}

const MOODS = [
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
  "cinematic",
  "sparkling",
  "moody",
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

const INSTRUMENTATION = [
  "analog synth bass",
  "punchy drum machine groove",
  "plucky arpeggio",
  "wide pad bed",
  "glassy keys",
  "clean electric guitar hooks",
  "orchestral strings layer",
  "subby 808 support",
  "tight acoustic kit",
  "hand‑clap accents",
  "vocal ad‑libs",
  "warm sub bass",
  "sparkling top‑line synth",
  "airy backing oohs",
]

const MIX_NOTES = [
  "polished mix",
  "tight low end",
  "wide stereo image",
  "subtle tape saturation",
  "tasteful reverb tails",
  "sidechain movement to the kick",
  "crisp transient drums",
  "bright but smooth top line",
  "gentle bus glue compression",
]

const SECTION_LIBRARY = [
  { name: "Intro", styles: ["riser", "set the tone", "light percussion"] },
  { name: "Verse / Build", styles: ["add layers", "momentum", "anticipation"] },
  { name: "Chorus / Hook", styles: ["memorable hook", "stacked harmonies", "lift"] },
  { name: "Breakdown", styles: ["space", "texture focus"] },
  { name: "Bridge", styles: ["contrast", "variation"] },
  { name: "Outro", styles: ["resolve", "fade energy down"] },
]

// ——— helpers
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.trunc(n)))
const choice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const sample = <T,>(arr: T[], k: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, k)
const weighted = <T,>(pairs: Array<{ item: T; w: number }>) => {
  const sum = pairs.reduce((a, p) => a + p.w, 0)
  let r = Math.random() * sum
  for (const p of pairs) {
    if ((r -= p.w) <= 0) return p.item
  }
  return pairs[0]?.item
}

function bpmForGenre(genre: string) {
  const [lo, hi] = GENRE_BPM[genre] ?? [96, 128]
  const base = Math.round(lo + Math.random() * (hi - lo))
  // snap to musically common values
  const snaps = [118, 120, 122, 124, 126, 128, 90, 100]
  const nearest = snaps.reduce((prev, cur) => (Math.abs(cur - base) < Math.abs(prev - base) ? cur : prev), base)
  return clamp(nearest, 60, 180)
}

function buildSections(totalMs: number, vocals: boolean): PlanSection[] {
  const count = clamp(Math.round(2 + Math.random() * 2), 2, 4)
  const picks = sample(SECTION_LIBRARY, count)
  const weights = picks.map(() => 1 + Math.random())
  const weightSum = weights.reduce((a, b) => a + b, 0)
  return picks.map((p, i) => {
    const dur = Math.round((weights[i] / weightSum) * totalMs)
    const local = sample(p.styles, Math.min(2, p.styles.length))
    return {
      section_name: p.name,
      duration_ms: clamp(dur, 3000, 30000),
      positive_local_styles: local,
      negative_local_styles: [],
      lines: vocals && /Chorus|Hook/i.test(p.name) ? ["Prompt. Refine. Ship."] : [],
    }
  })
}

// ——— main API
export function buildSurprisePreset(): SurprisePreset {
  const genre = choice(Object.keys(GENRE_BPM))
  const moods = Array.from(new Set(sample(MOODS, clamp(2 + Math.round(Math.random() * 2), 2, 4))))
  const bpm = bpmForGenre(genre)
  const key = choice(KEYS)
  const language = weighted([
    { item: "English", w: 0.7 },
    { item: choice(LANGUAGES.filter((l) => l !== "English")), w: 0.3 },
  ])
  const durationSec = clamp(Math.round(25 + Math.random() * 55), 10, 300)
  const instrumentalOnly = Math.random() < 0.15
  const vocals = instrumentalOnly ? false : Math.random() < 0.85
  const instruments = sample(INSTRUMENTATION, 2 + Math.round(Math.random() * 2))
  const mix = sample(MIX_NOTES, 2 + Math.round(Math.random() * 2))
  const extras = [...instruments, ...mix, "catchy chorus"].join(", ")

  const usePlan = Math.random() < 0.4
  const sections = usePlan ? buildSections(durationSec * 1000, vocals) : undefined

  const id = Math.random().toString(36).slice(2, 10).toUpperCase()

  return {
    id,
    genre,
    moods,
    bpm,
    key,
    language,
    durationSec,
    vocals,
    instrumentalOnly,
    extras,
    usePlan,
    sections,
  }
}
