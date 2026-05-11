import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ canGenerate: false, promptsUsed: 0, promptsLimit: 5 })
    }

    // Get user's total prompts
    const { data: user, error } = await supabase
      .from("user_logins")
      .select("total_prompts")
      .eq("vercel_user_id", userId)
      .maybeSingle()

    if (error) throw error

    const promptsUsed = user?.total_prompts || 0
    const promptsLimit = 5
    const canGenerate = promptsUsed < promptsLimit

    return NextResponse.json({
      canGenerate,
      promptsUsed,
      promptsLimit,
    })
  } catch (error) {
    console.error("Error checking user limit:", error)
    return NextResponse.json({ error: "Failed to check user limit" }, { status: 500 })
  }
}
