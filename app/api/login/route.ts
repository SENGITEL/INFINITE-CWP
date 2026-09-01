import { type NextRequest, NextResponse } from "next/server"
import { checkCredentials, createToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"

export async function POST(request: NextRequest) {
  let username = ""
  let password = ""

  try {
    const body = await request.json()
    username = String(body?.username ?? "").trim()
    password = String(body?.password ?? "")
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
  }

  const token = await createToken(username)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
