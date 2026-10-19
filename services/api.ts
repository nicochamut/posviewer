import type { PosResponse, PosResult, PosPayload, StoreFormData, StoreResponse } from "@/types"

// crypto.randomUUID solo existe en contextos seguros (https / localhost)
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// El token viaja siempre en el header Authorization, nunca en la URL
function authHeaders(accessToken: string, withIdempotency = false): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken.trim()}`,
  }
  if (withIdempotency) headers["X-Idempotency-Key"] = newIdempotencyKey()
  return headers
}

// Función para manejar errores de la API
const handleApiError = async (response: Response) => {
  let errorData: any = {}
  try {
    errorData = await response.json()
  } catch {
    // respuesta sin body
  }
  throw new Error(
    `Error: ${response.status} - ${response.statusText}${
      errorData.error || errorData.details ? `\nDetalle: ${JSON.stringify(errorData, null, 2)}` : ""
    }`,
  )
}

// Obtener todos los QRs (POS) de la cuenta
export async function fetchPosData(accessToken: string): Promise<PosResponse> {
  const response = await fetch(`/api/mercadopago`, { headers: authHeaders(accessToken) })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Crear un nuevo QR (POS)
export async function createPos(accessToken: string, payload: PosPayload): Promise<PosResult> {
  const response = await fetch(`/api/mercadopago`, {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Actualizar un QR (POS) existente — solo los campos que cambian
export async function updatePos(accessToken: string, posId: number, payload: PosPayload): Promise<PosResult> {
  const response = await fetch(`/api/mercadopago/${posId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Eliminar un QR (POS)
export async function deletePos(accessToken: string, posId: number): Promise<{ success: boolean }> {
  const response = await fetch(`/api/mercadopago/${posId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken, true),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return { success: true }
}

// Dar de alta una estación (Store)
export async function createStore(accessToken: string, storeData: StoreFormData): Promise<StoreResponse> {
  // Convertir latitude y longitude a números
  const formattedStoreData = {
    ...storeData,
    location: {
      ...storeData.location,
      latitude: Number.parseFloat(storeData.location.latitude),
      longitude: Number.parseFloat(storeData.location.longitude),
    },
  }

  const response = await fetch(`/api/mercadopago/store`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(formattedStoreData),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}
