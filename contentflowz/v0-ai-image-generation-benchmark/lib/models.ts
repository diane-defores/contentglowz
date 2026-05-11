import type { ModelConfig } from "./types"

export const MODELS: ModelConfig[] = [
  // {
  //   id: "nano-banana-gateway",
  //   name: "Nano Banana",
  //   type: "gemini",
  //   provider: "Vercel AI Gateway",
  //   cost: 0.042, // Average cost for reference only
  //   color: "#FF6B6B",
  // },
  {
    id: "fal-nano-banana",
    name: "Nano Banana",
    type: "fal-ai/nano-banana",
    provider: "Fal AI",
    cost: 0.039,
    color: "#4ECDC4",
  },
  {
    id: "fal-flux-schnell",
    name: "FLUX Schnell",
    type: "fal-ai/flux/schnell",
    provider: "Fal AI",
    cost: 0.003, // per MP for 1MP image
    color: "#45B7D1",
  },
  {
    id: "fal-flux-dev",
    name: "FLUX Dev",
    type: "fal-ai/flux/dev",
    provider: "Fal AI",
    cost: 0.025, // per MP for 1MP image
    color: "#96CEB4",
  },
  {
    id: "fal-flux-pro",
    name: "FLUX Pro v1.1",
    type: "fal-ai/flux-pro/v1.1",
    provider: "Fal AI",
    cost: 0.04, // per MP for 1MP image
    color: "#FFEAA7",
  },
  {
    id: "fal-sd35-medium",
    name: "Stable Diffusion 3.5 Medium",
    type: "fal-ai/stable-diffusion-v35-medium",
    provider: "Fal AI",
    cost: 0.065, // per MP for 1MP image
    color: "#DFE6E9",
  },
  {
    id: "flux-fast-schnell",
    name: "Flux Fast Schnell",
    type: "inference.flux-fast.schnell.txt2img.v1",
    provider: "Prodia",
    cost: 0.002, // for 1024x1024
    color: "#74B9FF",
  },
  {
    id: "flux-fast-dev",
    name: "Flux Fast Dev",
    type: "inference.flux-fast.dev.txt2img.v1",
    provider: "Prodia",
    cost: 0.02, // for 1024x1024
    color: "#A29BFE",
  },
  {
    id: "flux-pro-11",
    name: "Flux Pro 1.1",
    type: "inference.flux.pro11.txt2img.v1",
    provider: "Prodia",
    cost: 0.04, // for 1024x1024
    color: "#FD79A8",
  },
  {
    id: "flux-dev",
    name: "Flux Dev",
    type: "inference.flux.dev.txt2img.v2",
    provider: "Prodia",
    cost: 0.02, // for 1024x1024
    color: "#FDCB6E",
  },
  {
    id: "sd15",
    name: "Stable Diffusion 1.5",
    type: "inference.sd15.txt2img.v1",
    provider: "Prodia",
    cost: 0.0025, // for 512x512
    color: "#6C5CE7",
  },
  {
    id: "grok-2-image",
    name: "Grok 2 Image",
    type: "grok-2-image-1212",
    provider: "xAI",
    cost: 0.07, // per image
    color: "#FF6B35",
  },
]

export const MODEL_PRICING: Record<string, number> = MODELS.reduce(
  (acc, model) => {
    acc[model.id] = model.cost
    return acc
  },
  {} as Record<string, number>,
)
