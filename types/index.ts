// Interfaces para los datos de la API (/v2/pos)
export type OperatingMode = "unattended" | "self_service" | "pdv" | "standalone"

export interface PosQrResponse {
  uuid?: string
  image: string
  template_document: string
  template_image: string
  qr_code?: string
}

export interface PosQrConfig {
  operating_mode?: OperatingMode | string
  category?: number
  url?: string | null
}

export interface PosResult {
  id: number
  user_id: number
  name: string
  status?: "active" | "inactive" | string
  store_id?: string
  external_store_id?: string
  external_id: string
  config?: { qr?: PosQrConfig }
  qr_response?: PosQrResponse
  date_created: string
  date_last_updated: string
}

export interface PosPaging {
  total: number
  offset: number
  limit: number
}

export interface PosResponse {
  paging: PosPaging
  data: PosResult[]
}

// Payload que el front manda para crear/editar un QR
export interface PosPayload {
  name?: string
  store_id?: string
  external_store_id?: string
  external_id?: string
  config?: { qr?: PosQrConfig }
}

// Interfaces para los formularios
export interface EditFormData {
  name: string
  category?: number
  operating_mode: string // "" = sin definir
  url: string
}

export interface CreateFormData {
  name: string
  category: number
  operating_mode: string // "" = no enviar
  store_id: string
  external_store_id: string
  external_id: string
  url: string
  urlSuffix: string
  baseUrl: string
  apiCode: string
  locationType: string
  locationNumber: string
}

export interface StoreFormData {
  name: string
  external_id: string
  location: {
    zip_code: string
    street_number: string
    street_name: string
    city_name: string
    state_name: string
    latitude: string
    longitude: string
    reference: string
  }
}

export interface StoreResponse {
  id: string
  name: string
  external_id: string
  date_created: string
  location: {
    zip_code: string
    street_number: string
    street_name: string
    city_name: string
    state_name: string
    latitude: number
    longitude: number
    reference: string
  }
  [key: string]: any
}


// Estación de pagos.grupooleum.com.ar (sin tokens)
export interface Station {
  id: number
  external_id: string
  description: string
  flag: string | null
  active: boolean
  collector_id: string | null
  store_id: string | null
  url: string | null
  last_transaction: string | null
  has_token: boolean
}
