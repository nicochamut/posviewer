// Interfaces para los datos de la API
export interface PosQr {
  image: string
  template_document: string
  template_image: string
}

export interface PosResult {
  id: number
  user_id: number
  name: string
  fixed_amount: boolean
  store_id?: string
  external_id: string
  qr: PosQr
  date_created: string
  date_last_updated: string
  external_store_id?: string
  brand_id?: number
  url?: string
  category?: number
}

export interface PosPaging {
  total: number
  offset: number
  limit: number
}

export interface PosResponse {
  paging: PosPaging
  results: PosResult[]
}

// Interfaces para los formularios
export interface EditFormData {
  name: string
  fixed_amount: boolean
  category?: number
}

export interface CreateFormData {
  name: string
  fixed_amount: boolean
  category: number
  store_id: string
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

