import { getIronSession } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  authenticated?: boolean
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? process.env.CERES_PASSWORD ?? "fallback-secret-change-me",
  cookieName: "ceres-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.authenticated) {
    return null
  }
  return session
}
