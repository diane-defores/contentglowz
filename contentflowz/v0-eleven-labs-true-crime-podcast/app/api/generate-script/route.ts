import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    console.log("[v0] API Key present:", !!apiKey)

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const { topic, continueFrom, choice } = await request.json()

    console.log("[v0] Request params:", { topic, hasContinueFrom: !!continueFrom, choice })

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const prompt = continueFrom
      ? `Continue this true crime podcast story based on the listener's choice: "${choice}"

Previous story:
${continueFrom}

Create the NEXT SHORT SEGMENT (2-3 paragraphs maximum) with:
- Narrator (Ezekiel): Sets the scene and provides context
- The Informal Deal Maker: A shady informant or criminal contact
- The Ancient Evil: A mysterious antagonist or dark presence
- Demon Monster: A terrifying revelation or threat

Keep this segment under 1500 characters total.

At the end, provide 3 choices for what happens next in this format:
CHOICE 1: [Brief description]
CHOICE 2: [Brief description]
CHOICE 3: [Brief description]

IMPORTANT: Use PLAIN TEXT format only. Do NOT use markdown formatting like **bold** or *italic*.

Format as:
Narrator: [text]
Deal Maker: [text]
Ancient Evil: [text]
Demon: [text]`
      : `Create the OPENING SEGMENT of an interactive true crime podcast about "${topic}".

This is a SHORT introduction (2-3 paragraphs maximum) featuring:
- Narrator (Ezekiel): Introduces the case with an ominous tone
- The Informal Deal Maker: A shady informant who knows something
- The Ancient Evil: Hints at a dark conspiracy or supernatural element
- Demon Monster: A terrifying detail that sets the stakes

Keep this segment under 1500 characters total.

Use audio tags for emotion: [ominous], [whispers], [sinister laugh], [terrified], [dramatically]

At the end, provide 3 choices for how to investigate next:
CHOICE 1: [Brief description]
CHOICE 2: [Brief description]
CHOICE 3: [Brief description]

IMPORTANT: Use PLAIN TEXT format only. Do NOT use markdown formatting like **bold** or *italic*.

Format as:
Narrator: [text]
Deal Maker: [text]
Ancient Evil: [text]
Demon: [text]`

    console.log("[v0] Calling OpenAI API...")

    const { text: script } = await generateText({
      model: "openai/gpt-4o",
      system: `You are a true crime podcast writer specializing in dark, atmospheric storytelling with interactive elements. Create gripping narratives optimized for ElevenLabs v3 text-to-speech with emotional audio tags. Always output in PLAIN TEXT format without any markdown formatting.`,
      prompt,
    })

    console.log("[v0] OpenAI response received, length:", script?.length)
    console.log("[v0] Script preview:", script?.substring(0, 200))

    const choiceMatches = script.match(/CHOICE \d+: (.+)/g)
    const choices = choiceMatches ? choiceMatches.map((c) => c.replace(/CHOICE \d+: /, "")) : []

    console.log("[v0] Extracted choices:", choices.length)

    let scriptContent = script.replace(/CHOICE \d+: .+/g, "").trim()
    scriptContent = scriptContent.replace(/\*\*/g, "") // Remove bold markdown
    scriptContent = scriptContent.replace(/^---+$/gm, "") // Remove horizontal rules
    scriptContent = scriptContent.replace(/^#+\s+/gm, "") // Remove markdown headers
    scriptContent = scriptContent.trim()

    console.log("[v0] Returning response with script length:", scriptContent.length)

    return NextResponse.json({ script: scriptContent, choices })
  } catch (error) {
    console.error("[v0] Error in generate-script:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorStack = error instanceof Error ? error.stack : ""

    console.error("[v0] Error details:", { errorMessage, errorStack })

    return NextResponse.json(
      {
        error: `Script generation failed: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
