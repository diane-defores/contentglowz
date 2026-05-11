import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, getClientIP } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientIP = getClientIP(req)

    console.log("[v0] Claiming anonymous generations for user:", session.user.sub, "with IP:", clientIP)

    if (!clientIP) {
      console.log("[v0] No IP detected, cannot claim anonymous generations")
      return NextResponse.json({ claimed: 0 })
    }

    const supabase = await createAdminSupabaseClient()

    // Update all anonymous generations (user_id IS NULL) that have this IP
    // to belong to the newly authenticated user
    const { data, error } = await supabase
      .from("generations")
      .update({
        user_id: session.user.sub,
        user_email: session.user.email,
      })
      .eq("ip_address", clientIP)
      .is("user_id", null)
      .select()

    if (error) {
      console.error("Error claiming anonymous generations:", error)
      return NextResponse.json({ error: "Failed to claim generations" }, { status: 500 })
    }

    console.log("[v0] Successfully claimed", data?.length || 0, "anonymous generations")

    return NextResponse.json({ claimed: data?.length || 0 })
  } catch (error) {
    console.error("Error in claim endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
