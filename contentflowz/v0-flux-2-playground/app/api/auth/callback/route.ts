import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value
  const codeVerifier = cookieStore.get("oauth_code_verifier")?.value

  // Handle user cancellation
  if (error) {
    return NextResponse.redirect(`${req.nextUrl.origin}?error=${error}`)
  }

  // Validate state to prevent CSRF
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${req.nextUrl.origin}?error=invalid_state`)
  }

  if (!code || !codeVerifier) {
    return NextResponse.redirect(`${req.nextUrl.origin}?error=missing_code`)
  }

  try {
    const tokenBody = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID as string,
      client_secret: process.env.VERCEL_APP_CLIENT_SECRET as string,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: `${req.nextUrl.origin}/api/auth/callback`,
    }).toString()

    console.log("[v0] Token exchange request:", {
      url: "https://vercel.com/api/login/oauth/token",
      redirect_uri: `${req.nextUrl.origin}/api/auth/callback`,
      has_client_secret: !!process.env.VERCEL_APP_CLIENT_SECRET,
      has_code: !!code,
      has_code_verifier: !!codeVerifier,
    })

    const tokenResponse = await fetch("https://vercel.com/api/login/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody,
    })

    console.log("[v0] Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
      })
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log("[v0] Tokens received:", {
      has_id_token: !!tokens.id_token,
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
    })

    // Store tokens in secure httpOnly cookies
    cookieStore.set("id_token", tokens.id_token, {
      maxAge: 60 * 60, // 1 hour
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    })
    cookieStore.set("access_token", tokens.access_token, {
      maxAge: 60 * 60,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    })
    if (tokens.refresh_token) {
      cookieStore.set("refresh_token", tokens.refresh_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: true,
        httpOnly: true,
        sameSite: "lax",
      })
    }

    // Clean up PKCE cookies
    cookieStore.delete("oauth_state")
    cookieStore.delete("oauth_nonce")
    cookieStore.delete("oauth_code_verifier")

    return NextResponse.redirect(req.nextUrl.origin)
  } catch (error) {
    console.error("[v0] Auth callback error:", error)
    return NextResponse.redirect(`${req.nextUrl.origin}?error=token_exchange_failed`)
  }
}
