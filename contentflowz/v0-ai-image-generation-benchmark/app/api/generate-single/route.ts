import type { NextRequest } from "next/server"
import { createProdia } from "prodia/v2"
import * as fal from "@fal-ai/serverless-client"
import { Buffer } from "buffer"
import { calculateFalCost, calculateProdiaCost } from "@/lib/pricing"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  const { prompt, model } = await request.json()

  if (!prompt || !model) {
    return Response.json({ error: "Prompt and model are required" }, { status: 400 })
  }

  const startTime = performance.now()

  try {
    if (model.provider === "xAI") {
      const xaiApiKey = process.env.XAI_API_KEY
      if (!xaiApiKey) throw new Error("XAI_API_KEY not configured")

      const response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${xaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model.type,
          prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`xAI API error: ${errorData.error?.message || response.statusText}`)
      }

      const result = await response.json()

      const endTime = performance.now()
      const durationMs = endTime - startTime
      const duration = (durationMs / 1000).toFixed(2)

      const imageUrl = result.data?.[0]?.url
      if (!imageUrl) throw new Error("No image was generated")

      // Download and convert to base64
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      const base64Url = `data:image/jpeg;base64,${base64Image}`

      return Response.json({
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        imageUrl: base64Url,
        duration: `${duration}s`,
        durationMs,
        cost: `$${model.cost.toFixed(4)}`,
        success: true,
      })
    }

    if (model.provider === "Fal AI") {
      const result = await fal.subscribe(model.type, {
        input: {
          prompt,
          image_size: "square_hd",
          num_inference_steps: model.type.includes("schnell") ? 4 : 28,
          num_images: 1,
        },
        logs: false,
        onQueueUpdate: () => {},
      })

      const endTime = performance.now()
      const durationMs = endTime - startTime
      const duration = (durationMs / 1000).toFixed(2)

      const imageUrl = result.images?.[0]?.url
      if (!imageUrl) throw new Error("No image was generated")

      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      const base64Url = `data:image/jpeg;base64,${base64Image}`

      const imageWidth = result.images[0]?.width || 1024
      const imageHeight = result.images[0]?.height || 1024
      const cost = calculateFalCost(model.type, imageWidth, imageHeight)

      return Response.json({
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        imageUrl: base64Url,
        duration: `${duration}s`,
        durationMs,
        cost: `$${cost.toFixed(4)}`,
        success: true,
      })
    }

    const token = process.env.PRODIA_TOKEN
    if (!token) throw new Error("PRODIA_TOKEN not configured")

    const prodia = createProdia({ token })

    const job = await prodia.job({
      type: model.type as any,
      config: { prompt },
    })

    const endTime = performance.now()
    const durationMs = endTime - startTime
    const duration = (durationMs / 1000).toFixed(2)

    const imageBuffer = await job.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const imageUrl = `data:image/jpeg;base64,${base64Image}`

    const resolution = "1024x1024" // Prodia default
    const cost = calculateProdiaCost(model.type, resolution)

    return Response.json({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      imageUrl,
      duration: `${duration}s`,
      durationMs,
      cost: `$${cost.toFixed(4)}`,
      success: true,
    })
  } catch (error) {
    const endTime = performance.now()
    const durationMs = endTime - startTime
    const duration = (durationMs / 1000).toFixed(2)

    return Response.json({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      imageUrl: null,
      duration: `${duration}s`,
      durationMs,
      cost: "$0.0000",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
