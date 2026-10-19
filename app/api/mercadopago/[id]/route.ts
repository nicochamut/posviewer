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

function validPosId(id: string) {
  return /^\d+$/.test(id)
}

// Modifica un QR (POS) con PATCH /v2/pos/{pos_id}. Solo se envían los campos que cambian.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getAccessToken(request)
  if (!token) return missingTokenResponse()
  if (!validPosId(params.id)) return NextResponse.json({ error: "pos_id inválido" }, { status: 400 })

  try {
    const body = await request.json()
    const payload: Record<string, unknown> = {}

    if (body.name !== undefined) {
      const nameError = validatePosName(String(body.name))
      if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })
      payload.name = body.name
    }

    if (body.external_id !== undefined) {
      const externalIdError = validatePosExternalId(String(body.external_id))
      if (externalIdError) return NextResponse.json({ error: externalIdError }, { status: 400 })
      payload.external_id = body.external_id
    }

    const qr = body.config?.qr
    if (qr) {
      const qrConfig: Record<string, unknown> = {}
      if (qr.operating_mode !== undefined) {
        if (!OPERATING_MODES.includes(qr.operating_mode)) {
          return NextResponse.json({ error: `operating_mode inválido: ${qr.operating_mode}` }, { status: 400 })
        }
        qrConfig.operating_mode = qr.operating_mode
      }
      if (qr.category !== undefined) qrConfig.category = Number(qr.category)
      if (qr.url !== undefined) {
        if (qr.url && !/^https:\/\//.test(qr.url)) {
          return NextResponse.json({ error: "La URL debe comenzar con https://" }, { status: 400 })
        }
        qrConfig.url = qr.url || null
      }
      // En pdv/standalone MP exige url nula
      if (qrConfig.operating_mode && MODES_WITHOUT_URL.includes(qrConfig.operating_mode as string)) {
        qrConfig.url = null
      }
      if (Object.keys(qrConfig).length > 0) payload.config = { qr: qrConfig }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No hay cambios para enviar" }, { status: 400 })
    }

    const res = await mpFetch(`/v2/pos/${params.id}`, token, {
      method: "PATCH",
      body: payload,
      idempotencyKey: idempotencyKeyFrom(request),
    })
    if (!res.ok) return mpErrorResponse(res.status, res.data)

    return NextResponse.json(res.data)
  } catch (error) {
    return internalErrorResponse("Failed to update POS data", error)
  }
}

// Elimina un QR (POS) con DELETE /v2/pos/{pos_id}
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getAccessToken(request)
  if (!token) return missingTokenResponse()
  if (!validPosId(params.id)) return NextResponse.json({ error: "pos_id inválido" }, { status: 400 })

  try {
    const res = await mpFetch(`/v2/pos/${params.id}`, token, {
      method: "DELETE",
      idempotencyKey: idempotencyKeyFrom(request),
    })
    if (!res.ok) return mpErrorResponse(res.status, res.data)

    return NextResponse.json({ success: true, message: "POS deleted successfully" })
  } catch (error) {
    return internalErrorResponse("Failed to delete POS", error)
  }
}
