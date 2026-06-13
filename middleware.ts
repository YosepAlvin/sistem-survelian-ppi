import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any
  const role = user?.role

  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isAuthRoute = nextUrl.pathname.startsWith("/auth")
  const isAdminPageRoute = nextUrl.pathname.startsWith("/admin")
  const isIpcnPageRoute = nextUrl.pathname.startsWith("/ipcn")
  const isIpclnPageRoute = nextUrl.pathname.startsWith("/ipcln")

  // If it's an auth route, let it pass
  if (isAuthRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/auth/login", nextUrl))
  }

  // Role-based protection for PAGE routes only
  // API routes are protected inside their own route handlers for more fine-grained control
  if (role === "ADMIN") {
    return NextResponse.next()
  }

  if (isAdminPageRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  if (isIpcnPageRoute && role !== "IPCN") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  if (isIpclnPageRoute && role !== "IPCLN") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Protected routes
    "/admin/:path*",
    "/ipcn/:path*",
    "/ipcln/:path*",
    "/api/admin/:path*",
    "/api/ipcn/:path*",
    "/api/ipcln/:path*",
    "/api/verifikasi",
    "/api/verifikasi/:path*",
    "/api/pasien",
    "/api/pasien/:path*",
    "/api/surveilans-harian",
    "/api/surveilans-harian/:path*",
    "/api/monitoring",
    "/api/monitoring/:path*",
    "/api/notifications",
    "/api/notifications/:path*",
  ],
}
