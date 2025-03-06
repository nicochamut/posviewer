import type { PosResponse, PosResult, StoreFormData, StoreResponse, CreateFormData, EditFormData } from "@/types"

// Función para manejar errores de la API
const handleApiError = async (response: Response) => {
  const errorData = await response.json()
  throw new Error(
    `Error: ${response.status} - ${response.statusText}${
      errorData.error || errorData.details ? `\nDetalle: ${JSON.stringify(errorData, null, 2)}` : ""
    }`,
  )
}

// Obtener datos de POS
export async function fetchPosData(accessToken: string): Promise<PosResponse> {
  const response = await fetch(`/api/mercadopago?access_token=${encodeURIComponent(accessToken)}`)

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Crear un nuevo POS
export async function createPos(
  accessToken: string,
  createData: Omit<CreateFormData, "urlSuffix" | "apiCode" | "locationType" | "locationNumber" | "baseUrl">,
): Promise<PosResult> {
  const response = await fetch(`/api/mercadopago?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createData),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Actualizar un POS existente
export async function updatePos(
  accessToken: string,
  posId: number,
  updateData: Partial<EditFormData>,
): Promise<PosResult> {
  const response = await fetch(`/api/mercadopago/${posId}?access_token=${encodeURIComponent(accessToken)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

// Eliminar un POS
export async function deletePos(accessToken: string, posId: number): Promise<{ success: boolean }> {
  const response = await fetch(`/api/mercadopago/${posId}?access_token=${encodeURIComponent(accessToken)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return { success: true }
}

// Crear un nuevo Store
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

  const response = await fetch(`/api/mercadopago/store?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formattedStoreData),
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return await response.json()
}

