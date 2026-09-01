import { type NextRequest, NextResponse } from "next/server"
import { get, put } from "@vercel/blob"

export const runtime = "nodejs"
// Reads/writes must never be cached — this is live shared state.
export const dynamic = "force-dynamic"

// Only these shared keys are allowed to be persisted server-side.
const ALLOWED_KEYS = new Set(["bitacora-records", "sitios-db"])

function blobPath(key: string) {
  return `noc-storage/${key}.json`
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  try {
    const result = await get(blobPath(key), { access: "private" })
    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    const value = await new Response(result.stream).text()
    return NextResponse.json({ key, value }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] storage GET error:", error)
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 })
  }

  let value: string
  try {
    const body = await request.json()
    value = String(body?.value ?? "")
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    await put(blobPath(key), value, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return NextResponse.json({ ok: true, key })
  } catch (error) {
    console.error("[v0] storage POST error:", error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}
