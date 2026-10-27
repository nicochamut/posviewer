import { NextResponse } from "next/server"
import {
  MODES_WITHOUT_URL,
  OPERATING_MODES,
  mpErrorResponse,
  mpFetch,
  validatePosExternalId,
  validatePosName,
} from "@/lib/mercadopago"

// Operaciones de Mercado Pago compartidas entre las rutas de estación (token desde pagos)
// y las rutas por access token (alta de estación nueva y consulta).

const POS_PAGE_SIZE = 30 // máximo permitido por GET /v2/pos
const POS_MAX_PAGES = 50 // tope de seguridad (1500 QRs)
const STORES_PAGE_SIZE = 50
const STORES_MAX_PAGES = 20

type MpResult = { ok: true; data: any } | { ok: false; response: Response }

// Valida el formato del access token antes de mandarlo a MP
export function validAccessToken(token: unknown): token is string {
  return typeof token === "string" && /^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$/.test(token.trim())
}

// Cuenta dueña del token (el id es el collector_id / user_id)
export async function getMe(token: string): Promise<MpResult> {
  const me = await mpFetch("/users/me", token)
  if (!me.ok) return { ok: false, response: mpErrorResponse(me.status, me.data) }
  if (!me.data?.id) {
    return { ok: false, response: NextResponse.json({ error: "No se pudo obtener el user_id de la cuenta" }, { status: 400 }) }
  }
  return { ok: true, data: me.data }
}

// Todos los QRs (POS) de la cuenta, recorriendo todas las páginas de /v2/pos
export async function listAllPos(token: string): Promise<MpResult> {
  const all: any[] = []
  let total = 0
  for (let page = 0; page < POS_MAX_PAGES; page++) {
    const offset = page * POS_PAGE_SIZE
    const res = await mpFetch(`/v2/pos?offset=${offset}&limit=${POS_PAGE_SIZE}`, token)
    if (!res.ok) return { ok: false, response: mpErrorResponse(res.status, res.data) }
    const items: any[] = res.data?.data ?? []
    total = res.data?.paging?.total ?? items.length
    all.push(...items)
    if (items.length < POS_PAGE_SIZE || all.length >= total) break
  }
  return { ok: true, data: { paging: { total, offset: 0, limit: all.length }, data: all } }
}

// Todas las sucursales (stores) de la cuenta
export async function listAllStores(token: string, userId: number | string): Promise<MpResult> {
  const all: any[] = []
  let total = 0
  for (let page = 0; page < STORES_MAX_PAGES; page++) {
    const offset = page * STORES_PAGE_SIZE
    const res = await mpFetch(`/users/${userId}/stores/search?offset=${offset}&limit=${STORES_PAGE_SIZE}`, token)
    if (!res.ok) return { ok: false, response: mpErrorResponse(res.status, res.data) }
    const items: any[] = res.data?.results ?? []
    total = res.data?.paging?.total ?? items.length
    all.push(...items)
    if (items.length < STORES_PAGE_SIZE || all.length >= total) break
  }
  return { ok: true, data: all }
}

// Alta de sucursal con POST /users/{user_id}/stores (user_id desde /users/me)
export async function createStore(token: string, body: any): Promise<MpResult> {
  if (!body || typeof body !== "object") {
    return { ok: false, response: NextResponse.json({ error: "Faltan los datos de la sucursal" }, { status: 400 }) }
  }
  for (const field of ["name", "external_id", "location"]) {
    if (!body[field]) {
      return { ok: false, response: NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 }) }
    }
  }
  for (const field of ["zip_code", "street_number", "street_name", "city_name", "state_name", "latitude", "longitude"]) {
    const value = body.location[field]
    if (value === undefined || value === null || value === "" || Number.isNaN(value)) {
      return { ok: false, response: NextResponse.json({ error: `Location field '${field}' is required` }, { status: 400 }) }
    }
  }

  const me = await getMe(token)
  if (!me.ok) return me

  const res = await mpFetch(`/users/${me.data.id}/stores`, token, { method: "POST", body })
  if (!res.ok) return { ok: false, response: mpErrorResponse(res.status, res.data) }
  return { ok: true, data: res.data }
}

// Arma y valida el payload de POST /v2/pos a partir de lo que manda el front
export function buildCreatePosPayload(body: any): { payload: Record<string, unknown> } | { error: Response } {
  const bad = (msg: string) => ({ error: NextResponse.json({ error: msg }, { status: 400 }) })

  const name: string = (body?.name ?? "").toString()
  const externalId: string = (body?.external_id ?? "").toString()
  const storeId: string = (body?.store_id ?? "").toString().trim()
  const externalStoreId: string = (body?.external_store_id ?? "").toString().trim()
  const qr = body?.config?.qr ?? {}

  if (!externalId) return bad("Field 'external_id' is required")
  const externalIdError = validatePosExternalId(externalId)
  if (externalIdError) return bad(externalIdError)

  if (name) {
    const nameError = validatePosName(name)
    if (nameError) return bad(nameError)
  }

  if (!storeId && !externalStoreId) return bad("Se requiere 'store_id' o 'external_store_id'")

  if (qr.operating_mode && !OPERATING_MODES.includes(qr.operating_mode)) {
    return bad(`operating_mode inválido: ${qr.operating_mode}`)
  }

  // Armar config.qr solo con lo que vino (en v2 no existe fixed_amount)
  const qrConfig: Record<string, unknown> = {}
  if (qr.operating_mode) qrConfig.operating_mode = qr.operating_mode
  if (qr.category !== undefined && qr.category !== null && qr.category !== "") {
    qrConfig.category = Number(qr.category)
  }
  if (qr.url && !MODES_WITHOUT_URL.includes(qr.operating_mode)) {
    if (!/^https:\/\//.test(qr.url)) return bad("La URL debe comenzar con https://")
    qrConfig.url = qr.url
  }

  const payload: Record<string, unknown> = { external_id: externalId }
  if (name) payload.name = name
  if (storeId) payload.store_id = storeId
  else payload.external_store_id = externalStoreId
  if (Object.keys(qrConfig).length > 0) payload.config = { qr: qrConfig }

  return { payload }
}

export async function createPos(token: string, body: any, idempotencyKey: string): Promise<MpResult> {
  const built = buildCreatePosPayload(body)
  if ("error" in built) return { ok: false, response: built.error }

  const res = await mpFetch("/v2/pos", token, { method: "POST", body: built.payload, idempotencyKey })
  if (!res.ok) return { ok: false, response: mpErrorResponse(res.status, res.data) }
  return { ok: true, data: res.data }
}
