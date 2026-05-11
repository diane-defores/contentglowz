import type { NextRequest } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json()

    if (!script) {
      return new Response(JSON.stringify({ error: "Script is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey })

    const cleanScript = script
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/^---+$/gm, "") // Remove horizontal rules
      .replace(/^#+\s+/gm, "") // Remove markdown headers
      .trim()

    const lines = cleanScript.split("\n").filter((line: string) => line.trim())
    const inputs = []

    const voiceMap: Record<string, string> = {
      narrator: "2tTjAGX0n5ajDmazDcWk", // Ezekiel - narrator
      "deal maker": "alwWf0yOMMykcrIh8BlE", // The informal deal maker
      "ancient evil": "HH3kybY6uEJ2ebSa9Vy3", // The ancient evil
      demon: "vfaqCOvlrKi4Zp7C2IAm", // Demon monster
    }

    console.log("[v0] Parsing script lines:", lines.length)

    for (const line of lines) {
      const narratorMatch = line.match(/^Narrator:\s*(.+)$/i)
      const dealMakerMatch = line.match(/^Deal Maker:\s*(.+)$/i)
      const ancientEvilMatch = line.match(/^Ancient Evil:\s*(.+)$/i)
      const demonMatch = line.match(/^Demon:\s*(.+)$/i)

      if (narratorMatch) {
        console.log("[v0] Found Narrator line")
        inputs.push({ text: narratorMatch[1].trim(), voiceId: voiceMap.narrator })
      } else if (dealMakerMatch) {
        console.log("[v0] Found Deal Maker line")
        inputs.push({ text: dealMakerMatch[1].trim(), voiceId: voiceMap["deal maker"] })
      } else if (ancientEvilMatch) {
        console.log("[v0] Found Ancient Evil line")
        inputs.push({ text: ancientEvilMatch[1].trim(), voiceId: voiceMap["ancient evil"] })
      } else if (demonMatch) {
        console.log("[v0] Found Demon line")
        inputs.push({ text: demonMatch[1].trim(), voiceId: voiceMap.demon })
      }
    }

    console.log("[v0] Total speaker inputs found:", inputs.length)

    if (inputs.length === 0) {
      console.error("[v0] No valid speaker lines found. Script content:", cleanScript.substring(0, 500))
      return new Response(JSON.stringify({ error: "No valid speaker lines found in script" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const audioStream = await client.textToDialogue.stream({ inputs })

    return new Response(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error generating podcast:", error)
    return new Response(JSON.stringify({ error: "Failed to generate podcast" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
