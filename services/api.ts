import type { PosResponse, PosResult, PosPayload, Station, StoreFormData, StoreResponse } from "@/types"

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
  throw new Error(
    `Error: ${response.status} - ${response.statusText}${
      errorData.error || errorData.details ? `\nDetalle: ${JSON.stringify(errorData, null, 2)}` : ""
    }`,
  )
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

// Alta de la estación (sucursal) en Mercado Pago
export async function createStore(stationId: number, storeData: StoreFormData): Promise<StoreResponse> {
  const formattedStoreData = {
    ...storeData,
    location: {
      ...storeData.location,
      latitude: Number.parseFloat(storeData.location.latitude),
      longitude: Number.parseFloat(storeData.location.longitude),
    },
  }

  return request(`/api/stations/${stationId}/store`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(formattedStoreData),
  })
}
