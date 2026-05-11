import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth"
import { del } from "@vercel/blob"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const supabase = await createAdminSupabaseClient()

    // First, fetch the generation to verify ownership and get image URLs
    const { data: generation, error: fetchError } = await supabase.from("generations").select("*").eq("id", id).single()

    if (fetchError || !generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 })
    }

    // Verify ownership
    if (generation.user_id !== session.user.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete images from Vercel Blob
    if (generation.images && Array.isArray(generation.images)) {
      for (const imageUrl of generation.images) {
        try {
          await del(imageUrl)
        } catch (blobError) {
          console.error("Error deleting blob image:", imageUrl, blobError)
          // Continue even if blob deletion fails
        }
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase.from("generations").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting generation:", deleteError)
      return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in generations DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
