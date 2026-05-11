import { type NextRequest, NextResponse } from "next/server"

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const idToken = request.cookies.get("id_token")?.value

    if (!idToken) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Decode ID token (JWT) to get user info
    const payload = parseJwt(idToken)

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        username: payload.preferred_username,
        email: payload.email,
        picture: payload.picture,
      },
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
