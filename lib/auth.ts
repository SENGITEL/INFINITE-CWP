// Session helpers using the Web Crypto API so they work in both the
// Edge (middleware) and Node (route handler) runtimes.

export const SESSION_COOKIE = "noc_session"
// 8 hours
export const SESSION_MAX_AGE = 60 * 60 * 8

function getSecret(): string {
  return process.env.AUTH_SECRET || "noc-bitacora-dev-secret-change-me"
}

function toBase64Url(bytes: Uint8Array): string {
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  const str = atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  return toBase64Url(new Uint8Array(sig))
}

/** Creates a signed session token for the given username. */
export async function createToken(username: string): Promise<string> {
  const payloadObj = { u: username, iat: Date.now() }
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)))
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

/** Returns the username if the token is valid and unexpired, otherwise null. */
export async function verifyToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expected = await hmac(payload)
  // Constant-time-ish comparison
  if (sig.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return null
  try {
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      u: string
      iat: number
    }
    if (Date.now() - decoded.iat > SESSION_MAX_AGE * 1000) return null
    return decoded.u
  } catch {
    return null
  }
}

/**
 * Builds the map of valid users.
 * Configure with the NOC_USERS env var as a comma-separated list:
 *   "admin:noc2024,operador1:clave1,operador2:clave2"
 * Falls back to legacy NOC_USERNAME/NOC_PASSWORD, then to defaults.
 */
function getUsers(): Record<string, string> {
  const raw = process.env.NOC_USERS
  if (raw && raw.trim()) {
    const users: Record<string, string> = {}
    for (const pair of raw.split(",")) {
      const idx = pair.indexOf(":")
      if (idx === -1) continue
      const user = pair.slice(0, idx).trim()
      const pass = pair.slice(idx + 1).trim()
      if (user) users[user] = pass
    }
    if (Object.keys(users).length > 0) return users
  }

  // Fallback: single legacy user or built-in defaults.
  return {
    [process.env.NOC_USERNAME || "admin"]: process.env.NOC_PASSWORD || "noc2024",
    supervisor: "noc2024",
    operador: "noc2024",
  }
}

/** Validates username/password against the configured users. */
export function checkCredentials(username: string, password: string): boolean {
  const users = getUsers()
  const expected = users[username]
  if (expected === undefined) return false
  // Constant-time-ish comparison to avoid leaking length/content timing.
  if (expected.length !== password.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ password.charCodeAt(i)
  return diff === 0
}
