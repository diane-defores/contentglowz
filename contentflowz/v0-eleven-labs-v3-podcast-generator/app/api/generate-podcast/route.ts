import type { NextRequest } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Starting podcast generation API")
    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get("scriptId")
    console.log("[v0] Script ID received:", scriptId)

    if (!scriptId) {
      console.error("[v0] No script ID provided")
      return new Response(JSON.stringify({ error: "Script ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[v0] Creating Supabase client")
    const supabase = await createClient()
    console.log("[v0] Querying database for script:", scriptId)

    const { data: scriptData, error: dbError } = await supabase
      .from("podcast_scripts")
      .select("script_content")
      .eq("id", scriptId)
      .single()

    console.log("[v0] Database query result:", { scriptData: !!scriptData, dbError })

    if (dbError || !scriptData) {
      console.error("[v0] Database error or no script found:", dbError)
      return new Response(JSON.stringify({ error: "Script not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const script = scriptData.script_content
    console.log("[v0] Script retrieved, length:", script.length)

    const maxCharacters = 2900 // Leave some buffer under 3000 limit
    let processedScript = script

    if (script.length > maxCharacters) {
      console.log("[v0] Script too long, truncating from", script.length, "to", maxCharacters)
      processedScript = script.substring(0, maxCharacters)
      // Try to end at a complete line
      const lastNewline = processedScript.lastIndexOf("\n")
      if (lastNewline > maxCharacters * 0.8) {
        // Only truncate at newline if it's not too far back
        processedScript = processedScript.substring(0, lastNewline)
      }
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsApiKey) {
      console.error("[v0] ElevenLabs API key not configured")
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[v0] Creating ElevenLabs client")
    const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey })

    // Parse the script to extract speaker lines
    const lines = processedScript.split("\n").filter((line: string) => line.trim())
    const inputs = []

    const voiceIds = [
      "UgBBYS2sOqTuMpoF3BR0", // Mark - Natural Conversations (male, american)
      "NFG5qt843uXKj4pFvR7C", // Adam Stone - late night radio (male, british)
      "cgSgspJ2msm6clMCkdW9", // Hope - upbeat and clear (female, american)
      "56AoDkrOh6qfVPDXZ7Pt", // Cassidy (female, american)
    ]

    console.log("[v0] Parsing script lines:", lines.length)
    console.log("[v0] Full script content:", JSON.stringify(script))
    console.log(
      "[v0] Script lines:",
      lines.map((line, i) => `${i}: "${line}"`),
    )

    for (const line of lines) {
      console.log("[v0] Processing line:", JSON.stringify(line))
      const match = line.match(/^Speaker (\d+):\s*(.+)$/)
      if (match) {
        const speakerNumber = Number.parseInt(match[1]) - 1
        const text = match[2].trim()

        const voiceId = voiceIds[speakerNumber % voiceIds.length]

        inputs.push({
          text,
          voiceId,
        })

        console.log(
          "[v0] Added speaker line:",
          `Speaker ${speakerNumber + 1}`,
          "->",
          voiceId,
          "text length:",
          text.length,
        )
      } else {
        console.log("[v0] Line did not match Speaker pattern:", JSON.stringify(line))
      }
    }

    console.log("[v0] Parsed inputs:", inputs.length)
    if (inputs.length === 0) {
      console.error("[v0] No valid speaker lines found")
      return new Response(JSON.stringify({ error: "No valid speaker lines found in script" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(
      "[v0] Calling ElevenLabs textToDialogue.stream with total characters:",
      inputs.reduce((total, input) => total + input.text.length, 0),
    )

    console.log("[v0] Successfully created audio stream with", inputs.length, "inputs")

    const audioStream = await client.textToDialogue.stream({ inputs })

    return new Response(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating podcast:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return new Response(JSON.stringify({ error: "Failed to generate podcast" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
