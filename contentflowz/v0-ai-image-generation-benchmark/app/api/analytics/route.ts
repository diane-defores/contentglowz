import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from("user_logins")
      .select("*", { count: "exact", head: true })

    if (usersError) throw usersError

    // Get total prompts
    const { count: totalPrompts, error: promptsError } = await supabase
      .from("prompt_history")
      .select("*", { count: "exact", head: true })

    if (promptsError) throw promptsError

    // Get anonymous prompts (prompts with IP but no user ID)
    const { count: anonymousPrompts, error: anonError } = await supabase
      .from("prompt_history")
      .select("*", { count: "exact", head: true })
      .is("vercel_user_id", null)

    if (anonError) throw anonError

    // Get recent users (last 10)
    const { data: recentUsers, error: recentError } = await supabase
      .from("user_logins")
      .select("*")
      .order("last_login_at", { ascending: false })
      .limit(10)

    if (recentError) throw recentError

    // Get top users by prompt count
    const { data: topUsers, error: topError } = await supabase
      .from("user_logins")
      .select("*")
      .order("total_prompts", { ascending: false })
      .limit(10)

    if (topError) throw topError

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalPrompts: totalPrompts || 0,
      anonymousPrompts: anonymousPrompts || 0,
      authenticatedPrompts: (totalPrompts || 0) - (anonymousPrompts || 0),
      recentUsers,
      topUsers,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
