import type { NextRequest } from "next/server"

export const runtime = "nodejs"

const ELEVEN_COMPOSE_URL = "https://api.elevenlabs.io/v1/music"

type ComposeBody = {
  prompt?: string
  music_length_ms?: number
  composition_plan?: unknown
  model_id?: "music_v1"
}

function clampDuration(ms: number): number {
  const min = 10_000 // 10s
  const max = 300_000 // 5m
  if (Number.isFinite(ms)) return Math.min(max, Math.max(min, Math.trunc(ms)))
  return 30_000
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const input = (await req.json()) as ComposeBody & { output_format?: string }
    const {
      prompt,
      music_length_ms,
      composition_plan,
      model_id = "music_v1",
      output_format = "mp3_44100_128",
    } = input || {}

    if (!prompt && !composition_plan) {
      return new Response(JSON.stringify({ error: "Provide 'prompt' or 'composition_plan'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body: ComposeBody = { model_id }
    if (composition_plan) {
      body.composition_plan = composition_plan
    } else {
      body.prompt = String(prompt)
      if (music_length_ms) body.music_length_ms = clampDuration(music_length_ms)
    }

    const url = `${ELEVEN_COMPOSE_URL}?output_format=${encodeURIComponent(output_format)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000) // 60s safety

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!upstream.ok) {
      const detail = await upstream.text()
      return new Response(
        JSON.stringify({
          error: "ElevenLabs compose failed",
          status: upstream.status,
          detail,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }

    const arrayBuf = await upstream.arrayBuffer()
    const buf = Buffer.from(arrayBuf)

    // Eleven returns audio bytes; default is MP3 44.1kHz 128 kbps.
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    const isAbort = err?.name === "AbortError"
    return new Response(
      JSON.stringify({
        error: isAbort ? "Upstream timeout" : String(err?.message || err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
