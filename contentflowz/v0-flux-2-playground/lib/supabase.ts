import { createBrowserClient } from "@supabase/ssr"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { put } from "@vercel/blob"

// Client-side Supabase client (for browser operations if needed)
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function createAdminSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS - we validate Vercel OAuth in routes
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    },
  )
}

// Extract client IP from request headers (for anonymous rate limiting)
export function getClientIP(request: Request): string | null {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  const vercelIp = request.headers.get("x-vercel-forwarded-for")

  // x-forwarded-for can contain multiple IPs, take the first one (real client IP)
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  // Vercel specific header
  if (vercelIp) {
    return vercelIp.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // In development/localhost, generate a stable fingerprint from user agent
  const userAgent = request.headers.get("user-agent")
  if (userAgent && process.env.NODE_ENV === "development") {
    // Create a simple hash of the user agent as a pseudo-IP for development
    const hash = userAgent.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0
    }, 0)
    return `dev-${Math.abs(hash)}`
  }

  return null
}

// Upload image to Vercel Blob and return public URL
export async function uploadImageToBlob(
  imageBase64: string,
  userId: string | null,
  mimeType = "image/png",
): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, "base64")

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = mimeType.split("/")[1] || "png"

    const folder = userId || "anonymous"
    const filename = `${folder}/${timestamp}-${random}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mimeType,
    })

    return blob.url
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)
    return null
  }
}

// Types for our generations table
export interface Generation {
  id: string
  user_id: string | null // Vercel OAuth sub
  user_email: string | null // Vercel OAuth email
  ip_address: string | null // For anonymous rate limiting
  prompt: string
  model: string
  aspect_ratio: string
  quality: string
  number_of_images: number
  images: string[] // Array of Vercel Blob URLs
  reference_images: string[] | null
  created_at: string
}
