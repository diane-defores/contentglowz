import { cookies } from "next/headers"
import crypto from "node:crypto"

export interface UserInfo {
  sub: string
  name?: string
  email?: string
  preferred_username?: string
  picture?: string
}

export function generateSecureRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const randomBytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomBytes, (byte) => charset[byte % charset.length]).join("")
}

export async function getSession() {
  const cookieStore = await cookies()
  const idToken = cookieStore.get("id_token")?.value
  const accessToken = cookieStore.get("access_token")?.value

  if (!idToken || !accessToken) {
    return null
  }

  try {
    // Decode JWT (without verification for simplicity - in production you should verify)
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString())

    return {
      user: payload as UserInfo,
      accessToken,
    }
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("id_token")
  cookieStore.delete("access_token")
  cookieStore.delete("refresh_token")
}
