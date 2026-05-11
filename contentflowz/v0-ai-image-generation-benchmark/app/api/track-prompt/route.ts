import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { prompt, modelCount, successCount, totalCost, userId } = await request.json()

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    // Save prompt to history
    const { data, error } = await supabase
      .from("prompt_history")
      .insert({
        ip_address: ip,
        vercel_user_id: userId || null,
        prompt,
        model_count: modelCount,
        success_count: successCount,
        total_cost: totalCost,
      })
      .select()
      .single()

    if (error) throw error

    // If user is logged in, update their total prompts
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from("user_logins")
        .select("total_prompts")
        .eq("vercel_user_id", userId)
        .single()

      if (user && !userError) {
        await supabase
          .from("user_logins")
          .update({
            total_prompts: user.total_prompts + 1,
          })
          .eq("vercel_user_id", userId)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error tracking prompt:", error)
    return NextResponse.json({ error: "Failed to track prompt" }, { status: 500 })
  }
}
