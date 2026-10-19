import { type NextRequest, NextResponse } from "next/server"

// Se puede apuntar a un mock con MP_API_URL para pruebas locales
export const MP_API = process.env.MP_API_URL || "https://api.mercadopago.com"

// Modos de operación aceptados por /v2/pos (config.qr.operating_mode)
export const OPERATING_MODES = ["unattended", "self_service", "pdv", "standalone"] as const
// En estos modos MP exige que config.qr.url sea nula
export const MODES_WITHOUT_URL = ["pdv", "standalone"]

// El token llega desde el front en el header Authorization (nunca en la URL)
export function getAccessToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization") || ""
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

export function missingTokenResponse() {
  return NextResponse.json({ error: "Access token is required" }, { status: 401 })
}

interface MpFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  // Si se pasa, se envía X-Idempotency-Key (obligatorio en create/update/delete de /v2/pos)
  idempotencyKey?: string
}

export async function mpFetch(path: string, token: string, opts: MpFetchOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
  if (opts.idempotencyKey) headers["X-Idempotency-Key"] = opts.idempotencyKey

  const response = await fetch(`${MP_API}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  })

  // DELETE devuelve 204 sin body
  const text = await response.text()
  let data: any = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  return { ok: response.ok, status: response.status, data }
}

// Usa la key que manda el front (para que un reintento no duplique) o genera una nueva
export function idempotencyKeyFrom(request: NextRequest): string {
  return request.headers.get("x-idempotency-key") || crypto.randomUUID()
}

export function mpErrorResponse(status: number, details: unknown) {
  return NextResponse.json({ error: "Error from Mercado Pago API", details }, { status })
}

export function internalErrorResponse(message: string, error: unknown) {
  console.error(message, error)
  const details = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ error: message, details }, { status: 500 })
}

// Reglas de /v2/pos (compartidas con el front)
export { validatePosExternalId, validatePosName } from "@/utils/pos-validation"
