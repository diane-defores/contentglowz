import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId, email, name, avatarUrl } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_logins")
      .select("*")
      .eq("vercel_user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from("user_logins")
        .update({
          email,
          name,
          avatar_url: avatarUrl,
          last_login_at: new Date().toISOString(),
        })
        .eq("vercel_user_id", userId)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, user: data })
    } else {
      // Create new user record
      const { data, error } = await supabase
        .from("user_logins")
        .insert({
          vercel_user_id: userId,
          email,
          name,
          avatar_url: avatarUrl,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, user: data, isNewUser: true })
    }
  } catch (error) {
    console.error("Error tracking login:", error)
    return NextResponse.json({ error: "Failed to track login" }, { status: 500 })
  }
}
