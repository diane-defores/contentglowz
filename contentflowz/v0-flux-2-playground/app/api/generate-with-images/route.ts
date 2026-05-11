import { experimental_generateImage } from "ai"
import { getSession } from "@/lib/auth"
import { createAdminSupabaseClient, getClientIP, uploadImageToBlob } from "@/lib/supabase"

type ImageGenerationRequest = {
  prompt: string
  n?: number
  aspectRatio?: string
  quality?: string
  referenceImages?: string[]
}

function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  // Black Forest Labs supports dimensions from 256-1920 pixels
  // Aspect ratios from 3:7 (portrait) to 7:3 (landscape)
  const dimensionsMap: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
    "4:3": { width: 1024, height: 768 },
    "3:4": { width: 768, height: 1024 },
  }

  return dimensionsMap[aspectRatio] || dimensionsMap["1:1"]
}

async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    // If it's already a data URL, return the base64 part
    if (imageUrl.startsWith("data:image")) {
      return imageUrl.split(",")[1]
    }

    // If it's a Blob URL or any other URL, fetch and convert
    const response = await fetch(imageUrl)
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    return base64
  } catch (error) {
    console.error("Error converting image to base64:", error)
    throw new Error("Failed to process reference image")
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    const clientIP = getClientIP(req)

    console.log("[v0] Request details:", {
      hasSession: !!session,
      userId: session?.user.sub || null,
      clientIP: clientIP,
    })

    if (!process.env.AI_GATEWAY_API_KEY) {
      return Response.json({ error: "AI Gateway API key is not configured" }, { status: 500 })
    }

    if (!session && clientIP) {
      const adminSupabase = await createAdminSupabaseClient()
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { count, error: countError } = await adminSupabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .eq("ip_address", clientIP)
        .gte("created_at", twentyFourHoursAgo)

      if (countError) {
        console.error("Error checking IP rate limit:", countError)
      } else if (count !== null && count >= 1) {
        return Response.json(
          {
            error: "Rate limit exceeded",
            message: "You've used your free generation for today. Please sign in to continue.",
          },
          { status: 401 },
        )
      }
    }

    const body = (await req.json()) as ImageGenerationRequest

    if (!body.prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const numberOfImages = body.n || 1
    const aspectRatio = body.aspectRatio || "1:1"
    const quality = body.quality || "standard"
    const referenceImages = body.referenceImages || []

    const dimensions = getImageDimensions(aspectRatio)

    const providerOptions: any = {
      blackForestLabs: {
        width: dimensions.width,
        height: dimensions.height,
      },
    }

    if (referenceImages.length > 0) {
      try {
        const base64Image = await convertImageToBase64(referenceImages[0])
        providerOptions.blackForestLabs.inputImage = base64Image
      } catch (error) {
        console.error("Failed to process reference image:", error)
        // Continue without reference image rather than failing the whole request
      }
    }

    const result = await experimental_generateImage({
      model: "bfl/flux-2-pro",
      prompt: body.prompt,
      n: numberOfImages,
      providerOptions,
    })

    const userId = session?.user.sub || null
    const userEmail = session?.user.email || null

    const imageUploadPromises = result.images.map((img) =>
      uploadImageToBlob(img.base64, userId, img.mediaType || "image/png"),
    )

    const blobUrls = await Promise.all(imageUploadPromises)
    const successfulUrls = blobUrls.filter((url): url is string => url !== null)

    if (successfulUrls.length === 0) {
      return Response.json({ error: "Failed to upload images to Vercel Blob" }, { status: 500 })
    }

    const adminSupabase = await createAdminSupabaseClient()

    try {
      const generationData = {
        user_id: userId,
        user_email: userEmail,
        ip_address: session ? null : clientIP,
        prompt: body.prompt,
        model: "bfl/flux-2-pro",
        aspect_ratio: aspectRatio,
        quality: quality,
        number_of_images: numberOfImages,
        images: successfulUrls,
        reference_images: referenceImages.length > 0 ? referenceImages : null,
      }

      const { data: savedGeneration, error: saveError } = await adminSupabase
        .from("generations")
        .insert(generationData)
        .select()
        .single()

      if (saveError) {
        console.error("Error saving generation to Supabase:", saveError)
      }

      return Response.json({
        images: successfulUrls.map((url) => ({
          url,
          mimeType: "image/png",
        })),
        generationId: savedGeneration?.id,
      })
    } catch (saveError) {
      console.error("Error saving to Supabase:", saveError)
      return Response.json({
        images: successfulUrls.map((url) => ({
          url,
          mimeType: "image/png",
        })),
      })
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error generating image:", error)
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return Response.json(
      {
        error: "Failed to generate images",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
