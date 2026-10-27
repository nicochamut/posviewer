import type { PosResponse, PosResult, PosPayload, Station, StoreFormData, StoreResponse, TokenInfo } from "@/types"

// crypto.randomUUID solo existe en contextos seguros (https / localhost)
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// El token de Mercado Pago nunca pasa por el navegador: el servidor lo resuelve
// a partir de la sesión de pagos y el id de la estación.
function jsonHeaders(withIdempotency = false): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (withIdempotency) headers["X-Idempotency-Key"] = newIdempotencyKey()
  return headers
}

// Si la sesión venció, volver al login
function redirectToLogin() {
  if (typeof window !== "undefined") {
    const next = window.location.pathname
    window.location.href = next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"
  }
}

const handleApiError = async (response: Response) => {
  let errorData: any = {}
  try {
    errorData = await response.json()
  } catch {
    // respuesta sin body
  }
  if (response.status === 401) {
    redirectToLogin()
    throw new Error("Sesión vencida, volvé a ingresar")
  }
  const readable = mpErrorText(errorData)
  throw new Error(
    `Error: ${response.status} - ${response.statusText}${readable ? `\n${readable}` : ""}${
      errorData.error || errorData.details ? `\nDetalle: ${JSON.stringify(errorData, null, 2)}` : ""
    }`,
  )
}

// Saca el motivo legible de los errores de MP (stores usa causes[], /v2/pos usa errors[].details)
function mpErrorText(errorData: any): string | null {
  const d = errorData?.details
  if (!d || typeof d !== "object") return null
  const lines: string[] = []
  for (const c of d.causes ?? []) if (c?.description) lines.push(c.description)
  for (const e of d.errors ?? []) {
    for (const detail of e?.details ?? []) lines.push(String(detail))
    if (!e?.details?.length && e?.message) lines.push(e.message)
  }
  if (lines.length === 0 && d.message) lines.push(d.message)
  if (lines.length === 0) return null
  let text = lines.join("\n")
  if (/city_name was invalid/i.test(text)) {
    text +=
      "\n→ MP solo acepta las ciudades de su lista. Si la localidad no está, usá la cabecera de departamento con su código postal y poné la localidad real en Referencia."
  } else if (/zip_code was invalid/i.test(text)) {
    text += "\n→ El código postal tiene que corresponder a la ciudad elegida (no a la localidad real)."
  }
  return text
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init })
  if (!response.ok) await handleApiError(response)
  return (await response.json()) as T
}

// ----- Sesión -----
export async function login(username: string, password: string): Promise<{ ok: boolean; user: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ username, password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "No se pudo ingresar")
  return data
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
  window.location.href = "/login"
}

// ----- Estaciones -----
export async function fetchStations(refresh = false): Promise<{ user: string; data: Station[] }> {
  return request(`/api/stations${refresh ? "?refresh=1" : ""}`)
}

export async function fetchStation(stationId: number): Promise<Station> {
  return request(`/api/stations/${stationId}`)
}

// ----- QRs (POS) de una estación -----
export async function fetchPosData(stationId: number): Promise<PosResponse> {
  return request(`/api/stations/${stationId}/pos`)
}

export async function createPos(stationId: number, payload: PosPayload): Promise<PosResult> {
  return request(`/api/stations/${stationId}/pos`, {
    method: "POST",
    headers: jsonHeaders(true),
    body: JSON.stringify(payload),
  })
}

export async function updatePos(stationId: number, posId: number, payload: PosPayload): Promise<PosResult> {
  return request(`/api/stations/${stationId}/pos/${posId}`, {
    method: "PATCH",
    headers: jsonHeaders(true),
    body: JSON.stringify(payload),
  })
}

export async function deletePos(stationId: number, posId: number): Promise<{ success: boolean }> {
  return request(`/api/stations/${stationId}/pos/${posId}`, {
    method: "DELETE",
    headers: jsonHeaders(true),
  })
}

// Lat/long como número, como los pide MP
function formatStoreData(storeData: StoreFormData) {
  return {
    ...storeData,
    location: {
      ...storeData.location,
      latitude: Number.parseFloat(storeData.location.latitude.replace(",", ".")),
      longitude: Number.parseFloat(storeData.location.longitude.replace(",", ".")),
    },
  }
}

// Alta de la estación (sucursal) en Mercado Pago
export async function createStore(stationId: number, storeData: StoreFormData): Promise<StoreResponse> {
  return request(`/api/stations/${stationId}/store`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(formatStoreData(storeData)),
  })
}

// ----- Por access token (estación que todavía no está en pagos) -----
// El token va en el body, nunca en la URL, y el servidor no lo guarda.
export async function fetchTokenInfo(accessToken: string): Promise<TokenInfo> {
  return request("/api/token/info", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ access_token: accessToken }),
  })
}

export async function createStoreWithToken(accessToken: string, storeData: StoreFormData): Promise<StoreResponse> {
  return request("/api/token/store", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ access_token: accessToken, store: formatStoreData(storeData) }),
  })
}

export async function createPosWithToken(accessToken: string, payload: PosPayload): Promise<PosResult> {
  return request("/api/token/pos", {
    method: "POST",
    headers: jsonHeaders(true),
    body: JSON.stringify({ access_token: accessToken, pos: payload }),
  })
}
