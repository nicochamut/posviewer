import { type NextRequest, NextResponse } from "next/server"
import {
  MODES_WITHOUT_URL,
  OPERATING_MODES,
  getAccessToken,
  idempotencyKeyFrom,
  internalErrorResponse,
  missingTokenResponse,
  mpErrorResponse,
  mpFetch,
  validatePosExternalId,
  validatePosName,
} from "@/lib/mercadopago"

const PAGE_SIZE = 30 // máximo permitido por GET /v2/pos
const MAX_PAGES = 50 // tope de seguridad (1500 QRs)

// Lista todos los QRs (POS) de la cuenta, recorriendo todas las páginas de /v2/pos
export async function GET(request: NextRequest) {
  const token = getAccessToken(request)
  if (!token) return missingTokenResponse()

  try {
    const all: any[] = []
    let total = 0

    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * PAGE_SIZE
      const res = await mpFetch(`/v2/pos?offset=${offset}&limit=${PAGE_SIZE}`, token)
      if (!res.ok) return mpErrorResponse(res.status, res.data)

      const items: any[] = res.data?.data ?? []
      total = res.data?.paging?.total ?? items.length
      all.push(...items)

      if (items.length < PAGE_SIZE || all.length >= total) break
    }

    return NextResponse.json({
      paging: { total, offset: 0, limit: all.length },
      data: all,
    })
  } catch (error) {
    return internalErrorResponse("Failed to fetch data from Mercado Pago API", error)
  }
}

// Crea un QR (POS) con POST /v2/pos
export async function POST(request: NextRequest) {
  const token = getAccessToken(request)
  if (!token) return missingTokenResponse()

  try {
    const body = await request.json()
    const name: string = (body.name ?? "").toString()
    const externalId: string = (body.external_id ?? "").toString()
    const storeId: string = (body.store_id ?? "").toString().trim()
    const externalStoreId: string = (body.external_store_id ?? "").toString().trim()
    const qr = body.config?.qr ?? {}

    if (!externalId) return NextResponse.json({ error: "Field 'external_id' is required" }, { status: 400 })
    const externalIdError = validatePosExternalId(externalId)
    if (externalIdError) return NextResponse.json({ error: externalIdError }, { status: 400 })

    if (name) {
      const nameError = validatePosName(name)
      if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })
    }

    if (!storeId && !externalStoreId) {
      return NextResponse.json({ error: "Se requiere 'store_id' o 'external_store_id'" }, { status: 400 })
    }

    if (qr.operating_mode && !OPERATING_MODES.includes(qr.operating_mode)) {
      return NextResponse.json({ error: `operating_mode inválido: ${qr.operating_mode}` }, { status: 400 })
    }

    // Armar config.qr solo con lo que vino
    const qrConfig: Record<string, unknown> = {}
    if (qr.operating_mode) qrConfig.operating_mode = qr.operating_mode
    if (qr.category !== undefined && qr.category !== null && qr.category !== "") {
      qrConfig.category = Number(qr.category)
    }
    if (qr.url && !MODES_WITHOUT_URL.includes(qr.operating_mode)) {
      if (!/^https:\/\//.test(qr.url)) {
        return NextResponse.json({ error: "La URL debe comenzar con https://" }, { status: 400 })
      }
      qrConfig.url = qr.url
    }

    const payload: Record<string, unknown> = { external_id: externalId }
    if (name) payload.name = name
    if (storeId) payload.store_id = storeId
    else payload.external_store_id = externalStoreId
    if (Object.keys(qrConfig).length > 0) payload.config = { qr: qrConfig }

    const res = await mpFetch("/v2/pos", token, {
      method: "POST",
      body: payload,
      idempotencyKey: idempotencyKeyFrom(request),
    })
    if (!res.ok) return mpErrorResponse(res.status, res.data)

    return NextResponse.json(res.data, { status: 201 })
  } catch (error) {
    return internalErrorResponse("Failed to create POS data", error)
  }
}
