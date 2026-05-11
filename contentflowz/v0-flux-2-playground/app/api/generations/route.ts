import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminSupabaseClient()

    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", session.user.sub)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching generations:", error)
      return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 })
    }

    return NextResponse.json({ generations: data })
  } catch (error) {
    console.error("Error in generations GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { prompt, model, aspectRatio, quality, numberOfImages, images, referenceImages } = body

    const supabase = await createAdminSupabaseClient()

    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: session.user.sub,
        user_email: session.user.email,
        prompt,
        model,
        aspect_ratio: aspectRatio,
        quality,
        number_of_images: numberOfImages,
        images,
        reference_images: referenceImages || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving generation:", error)
      return NextResponse.json({ error: "Failed to save generation" }, { status: 500 })
    }

    return NextResponse.json({ generation: data })
  } catch (error) {
    console.error("Error in generations POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
