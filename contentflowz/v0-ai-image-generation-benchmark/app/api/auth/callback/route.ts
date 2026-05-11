import { type NextRequest, NextResponse } from "next/server"
import { AUTH_CONFIG } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      const errorDescription = searchParams.get("error_description")
      console.error("[v0] OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, request.url),
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/?auth_error=missing_code_or_state", request.url))
    }

    const storedState = request.cookies.get("oauth_state")?.value
    if (state !== storedState) {
      return NextResponse.redirect(new URL("/?auth_error=invalid_state", request.url))
    }

    const codeVerifier = request.cookies.get("code_verifier")?.value
    if (!codeVerifier) {
      return NextResponse.redirect(new URL("/?auth_error=missing_code_verifier", request.url))
    }

    const tokenResponse = await fetch(AUTH_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: AUTH_CONFIG.clientId,
        client_secret: AUTH_CONFIG.clientSecret,
        code,
        code_verifier: codeVerifier,
        redirect_uri: AUTH_CONFIG.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", errorData)
      return NextResponse.redirect(new URL("/?auth_error=token_exchange_failed", request.url))
    }

    const tokens = await tokenResponse.json()

    const idToken = tokens.id_token
    let userId = null
    let userEmail = null
    let userName = null
    let userAvatar = null

    if (idToken) {
      try {
        const base64Url = idToken.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        )
        const payload = JSON.parse(jsonPayload)

        userId = payload.sub
        userEmail = payload.email
        userName = payload.name
        userAvatar = payload.picture

        // Track login in database
        if (userId) {
          await fetch(new URL("/api/track-login", request.url).toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              email: userEmail,
              name: userName,
              avatarUrl: userAvatar,
            }),
          })
        }
      } catch (parseError) {
        console.error("[v0] Failed to parse ID token:", parseError)
      }
    }

    const response = NextResponse.redirect(new URL("/", request.url))

    response.cookies.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in || 3600,
      path: "/",
    })

    if (tokens.id_token) {
      response.cookies.set("id_token", tokens.id_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in || 3600,
        path: "/",
      })
    }

    response.cookies.delete("code_verifier")
    response.cookies.delete("oauth_state")

    return response
  } catch (error) {
    console.error("[v0] Callback error:", error)
    return NextResponse.redirect(new URL("/?auth_error=unexpected_error", request.url))
  }
}
