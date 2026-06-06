import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import type { SessionData } from "@/lib/auth"

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? process.env.CERES_PASSWORD ?? "fallback-secret-change-me",
  cookieName: "ceres-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(request, res, SESSION_OPTIONS)

  if (!session.authenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
