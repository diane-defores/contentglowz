import { NextResponse } from "next/server"
import { AUTH_CONFIG, generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/auth"

export async function GET() {
  try {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri,
      response_type: "code",
      scope: AUTH_CONFIG.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    const authUrl = `${AUTH_CONFIG.authorizationEndpoint}?${params.toString()}`

    // Store code_verifier and state in cookies for callback verification
    const response = NextResponse.redirect(authUrl)
    response.cookies.set("code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Auth login error:", error)
    return NextResponse.json({ error: "Failed to initialize OAuth flow" }, { status: 500 })
  }
}
