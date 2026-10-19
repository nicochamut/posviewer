import crypto from "node:crypto"
import { cookies } from "next/headers"

// Sesión del panel: guarda (cifrada) la cookie de sesión de pagos.grupooleum.com.ar.
// La contraseña del usuario nunca se guarda.

export const SESSION_COOKIE = "pv_session"
const SESSION_HOURS = 12

export interface SessionData {
  user: string
  pagosCookie: string // header Cookie para hablar con pagos.grupooleum.com.ar
  exp: number // epoch ms
}

function key(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

function encrypt(data: SessionData): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

function decrypt(value: string): SessionData | null {
  try {
    const raw = Buffer.from(value, "base64url")
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const enc = raw.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv)
    decipher.setAuthTag(tag)
    const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")
    const data = JSON.parse(json) as SessionData
    if (!data.exp || Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

export function getSession(): SessionData | null {
  const value = cookies().get(SESSION_COOKIE)?.value
  return value ? decrypt(value) : null
}

export function setSession(user: string, pagosCookie: string) {
  const data: SessionData = { user, pagosCookie, exp: Date.now() + SESSION_HOURS * 3600 * 1000 }
  cookies().set(SESSION_COOKIE, encrypt(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  })
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE)
}
