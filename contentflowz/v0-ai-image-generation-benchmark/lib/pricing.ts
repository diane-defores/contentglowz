// Fal AI pricing per megapixel
export const FAL_PRICING = {
  "fal-ai/flux/schnell": 0.003, // per MP
  "fal-ai/flux/dev": 0.025, // per MP
  "fal-ai/flux-pro/v1.1": 0.04, // per MP
  "fal-ai/stable-diffusion-v35-medium": 0.02, // per MP
  "fal-ai/nano-banana": 0.04, // flat rate per image
}

// Prodia pricing by resolution and model
export const PRODIA_PRICING = {
  "inference.flux-fast.schnell.txt2img.v1": { "1024x1024": 0.002, "512x512": 0.001 },
  "inference.flux-fast.dev.txt2img.v1": { "1024x1024": 0.02 },
  "inference.flux.pro11.txt2img.v1": { "1024x1024": 0.04 },
  "inference.flux.dev.txt2img.v2": { "1024x1024": 0.02 },
  "inference.sd15.txt2img.v1": { "512x512": 0.0025, "1024x1024": 0.008 },
}

// Gemini pricing (per million tokens)
export const GEMINI_PRICING = {
  input: 0.3, // $0.30 per 1M tokens
  output: 2.5, // $2.50 per 1M tokens
}

/**
 * Calculate cost for Fal AI models based on image dimensions
 */
export function calculateFalCost(modelType: string, width = 1024, height = 1024): number {
  const flatRate = FAL_PRICING[modelType as keyof typeof FAL_PRICING]
  return flatRate || 0
}

/**
 * Calculate cost for Prodia models based on resolution
 */
export function calculateProdiaCost(modelType: string, resolution = "1024x1024"): number {
  const pricing = PRODIA_PRICING[modelType as keyof typeof PRODIA_PRICING]
  if (!pricing) return 0

  // Use the specific resolution pricing or fallback to first available
  return pricing[resolution as keyof typeof pricing] || Object.values(pricing)[0] || 0
}

/**
 * Calculate cost for Gemini models based on token usage
 */
export function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_PRICING.input
  const outputCost = (outputTokens / 1_000_000) * GEMINI_PRICING.output
  return inputCost + outputCost
}
