import { type NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, verifyToken } from "@/lib/auth"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const username = await verifyToken(token)

  // Public auth endpoints: if already logged in, bounce to the app.
  if (pathname === "/login" || pathname === "/api/login") {
    if (username) return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  // Everything else in the matcher is protected.
  if (!username) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Serve the dashboard HTML at the root path.
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/app.html", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/app.html", "/login", "/api/login", "/api/logout", "/api/storage/:path*"],
}
