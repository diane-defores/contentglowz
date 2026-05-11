import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    const { data: existingIp, error: fetchError } = await supabase
      .from("ip_usage")
      .select("*")
      .eq("ip_address", ip)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (existingIp) {
      // Update existing IP
      const { data, error } = await supabase
        .from("ip_usage")
        .update({
          prompt_count: existingIp.prompt_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("ip_address", ip)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        promptCount: data.prompt_count,
        canGenerate: data.prompt_count < 1,
      })
    } else {
      // Create new IP record
      const { data, error } = await supabase
        .from("ip_usage")
        .insert({
          ip_address: ip,
          prompt_count: 1,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        promptCount: data.prompt_count,
        canGenerate: data.prompt_count < 1,
      })
    }
  } catch (error) {
    console.error("Error tracking IP:", error)
    return NextResponse.json({ error: "Failed to track IP" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    const { data, error } = await supabase.from("ip_usage").select("*").eq("ip_address", ip).maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      promptCount: data?.prompt_count || 0,
      canGenerate: (data?.prompt_count || 0) < 1,
    })
  } catch (error) {
    console.error("Error fetching IP:", error)
    return NextResponse.json({ error: "Failed to fetch IP" }, { status: 500 })
  }
}
