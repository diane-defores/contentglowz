export type ImageResult = {
  modelId: string
  modelName: string
  provider: string
  imageUrl: string | null
  duration: string
  durationMs: number
  cost: string
  success: boolean
  error?: string
  tokens?: {
    input: number
    output: number
    total: number
  }
}

export type TestResult = {
  testId: number
  timestamp: number
  prompt: string
  results: ImageResult[]
}

export type ModelConfig = {
  id: string
  name: string
  type: string
  provider: "Vercel AI Gateway" | "Fal AI" | "Prodia"
  cost: number
  color: string
}
