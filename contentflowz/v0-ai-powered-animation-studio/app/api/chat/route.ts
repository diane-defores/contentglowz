import { generateText } from "ai"
import { google } from "@ai-sdk/google"

function extractColor(text: string): string {
  const colorMap: { [key: string]: string } = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    purple: "#a855f7",
    pink: "#ec4899",
    orange: "#f97316",
    cyan: "#06b6d4",
    lime: "#84cc16",
    indigo: "#6366f1",
    teal: "#14b8a6",
    rose: "#f43f5e",
    amber: "#f59e0b",
    emerald: "#10b981",
    violet: "#8b5cf6",
    sky: "#0ea5e9",
    white: "#ffffff",
    black: "#000000",
    gray: "#6b7280",
  }

  const lowerText = text.toLowerCase()
  for (const [color, hex] of Object.entries(colorMap)) {
    if (lowerText.includes(color)) {
      return hex
    }
  }
  return "#3b82f6"
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json({
        message: "Please add your GOOGLE_GENERATIVE_AI_API_KEY environment variable in Project Settings to enable AI assistance.",
        toolCall: null,
      })
    }

    const lastMessage = messages[messages.length - 1]?.content || ""

    const contextInfo = context
      ? `
Current Context:
- Selected Layer: ${context.selectedLayer ? `${context.selectedLayer.name} (${context.selectedLayer.type})` : "None"}
- Total Layers: ${context.totalLayers}
- Current Time: ${context.currentTime}s
- Duration: ${context.duration}s
${context.selectedLayer ? `- Selected Properties: x=${context.selectedLayer.properties.x}, y=${context.selectedLayer.properties.y}, color=${context.selectedLayer.content?.fill || "N/A"}` : ""}
`
      : ""

    let toolCall = null
    const lowerMessage = lastMessage.toLowerCase()

    // Determine which tool to use based on user request
    if (lowerMessage.includes("add") && (lowerMessage.includes("text") || lowerMessage.includes("label"))) {
      const text = lastMessage.match(/["']([^"']+)["']/) || lastMessage.match(/says?\s+(.+)/i)
      toolCall = {
        action: "add_text",
        name: `Text Layer ${Date.now()}`,
        x: 200,
        y: 200,
        width: 200,
        height: 50,
        text: text ? text[1] : "Sample Text",
        color: extractColor(lastMessage),
        fontSize: 24,
        fontFamily: "Arial",
      }
    } else if (lowerMessage.includes("add") || lowerMessage.includes("create")) {
      let shape = "circle"
      if (lowerMessage.includes("rectangle") || lowerMessage.includes("square")) shape = "rectangle"
      else if (lowerMessage.includes("triangle")) shape = "triangle"
      else if (lowerMessage.includes("star")) shape = "star"
      else if (lowerMessage.includes("line")) shape = "line"
      else if (lowerMessage.includes("arrow")) shape = "arrow"

      toolCall = {
        action: "add_shape",
        shape,
        name: `${shape.charAt(0).toUpperCase() + shape.slice(1)} ${Date.now()}`,
        x: Math.floor(Math.random() * 300) + 100,
        y: Math.floor(Math.random() * 300) + 100,
        width: shape === "rectangle" ? 100 : undefined,
        height: shape === "rectangle" ? 80 : undefined,
        r: shape === "circle" ? 50 : undefined,
        color: extractColor(lastMessage),
      }
    } else if ((lowerMessage.includes("change") || lowerMessage.includes("update")) && context?.selectedLayer) {
      if (lowerMessage.includes("color")) {
        toolCall = {
          action: "update_properties",
          layerId: context.selectedLayer.id,
          properties: {
            content: {
              fill: extractColor(lastMessage),
            },
          },
        }
      } else if (lowerMessage.includes("rotate")) {
        const rotation = lowerMessage.match(/(\d+)/) ? Number.parseInt(lowerMessage.match(/(\d+)/)[1]) : 45
        toolCall = {
          action: "transform",
          layerId: context.selectedLayer.id,
          transform: {
            rotation,
          },
        }
      }
    } else if (lowerMessage.includes("animate") || lowerMessage.includes("bounce") || lowerMessage.includes("move")) {
      const layerId = context?.selectedLayer?.id || "temp_id"

      if (lowerMessage.includes("bounce")) {
        toolCall = {
          action: "update_animation",
          layerId,
          keyframes: [
            { time: 0, properties: { y: 100 }, easing: "ease-out" },
            { time: 0.5, properties: { y: 300 }, easing: "ease-in" },
            { time: 1, properties: { y: 100 }, easing: "ease-out" },
            { time: 1.5, properties: { y: 250 }, easing: "ease-in" },
            { time: 2, properties: { y: 100 }, easing: "ease-out" },
          ],
        }
      } else if (lowerMessage.includes("rotate")) {
        toolCall = {
          action: "update_animation",
          layerId,
          keyframes: [
            { time: 0, properties: { rotation: 0 }, easing: "linear" },
            { time: 2, properties: { rotation: 360 }, easing: "linear" },
          ],
        }
      }
    }

    const result = await generateText({
      model: google("gemini-2.5-flash-lite"),
      messages,
      system: `You are an AI animation assistant for a professional animation studio. You help users create animations by understanding their requests and calling the appropriate tools.

${contextInfo}

Guidelines:
- When user mentions "selected" or "selected shape", use the selected layer context
- Use reasonable default values (positions 100-400, sizes 50-150px)
- Extract colors accurately from user requests
- Create smooth animations (1-3 seconds duration)
- Be concise but helpful
- For complex animations like "bouncing ball", use multiple tools in sequence

Respond with helpful guidance about what you're doing.`,
    })

    return Response.json({
      message: result.text,
      toolCall,
    })
  } catch (error) {
    console.error("AI SDK error:", error)
    return Response.json({
      message: "I'm having trouble connecting to the AI service. Please check your API key and try again.",
      toolCall: null,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
