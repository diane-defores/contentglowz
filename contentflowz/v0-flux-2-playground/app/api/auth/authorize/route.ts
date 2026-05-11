import crypto from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateSecureRandomString } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const state = generateSecureRandomString(43)
  const nonce = generateSecureRandomString(43)
  const code_verifier = crypto.randomBytes(43).toString("hex")
  const code_challenge = crypto.createHash("sha256").update(code_verifier).digest("base64url")

  const cookieStore = await cookies()

  // Store PKCE values in secure cookies
  cookieStore.set("oauth_state", state, {
    maxAge: 10 * 60, // 10 minutes
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  })
  cookieStore.set("oauth_nonce", nonce, {
    maxAge: 10 * 60,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  })
  cookieStore.set("oauth_code_verifier", code_verifier, {
    maxAge: 10 * 60,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  })

  const queryParams = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID as string,
    redirect_uri: `${req.nextUrl.origin}/api/auth/callback`,
    state,
    nonce,
    code_challenge,
    code_challenge_method: "S256",
    response_type: "code",
    scope: "openid email profile",
  })

  const authorizationUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`
  return NextResponse.redirect(authorizationUrl)
}
