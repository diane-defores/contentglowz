import type { NextRequest } from "next/server"

export const runtime = "nodejs"

const ELEVEN_PLAN_URL = "https://api.elevenlabs.io/v1/music/plan"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { prompt, music_length_ms } = (await req.json()) as {
      prompt?: string
      music_length_ms?: number
    }

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'prompt'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body: Record<string, unknown> = { prompt: String(prompt) }
    if (Number.isFinite(music_length_ms)) {
      const ms = Math.trunc(music_length_ms!)
      body.music_length_ms = Math.min(300_000, Math.max(10_000, ms))
    }

    const upstream = await fetch(ELEVEN_PLAN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!upstream.ok) {
      const detail = await upstream.text()
      return new Response(
        JSON.stringify({
          error: "ElevenLabs plan failed",
          status: upstream.status,
          detail,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(await upstream.text(), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
