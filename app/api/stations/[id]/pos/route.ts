import { type NextRequest, NextResponse } from "next/server"
import { idempotencyKeyFrom, internalErrorResponse } from "@/lib/mercadopago"
import { createPos, listAllPos } from "@/lib/mp-ops"
import { withStation } from "@/lib/station-auth"

// Lista todos los QRs (POS) de la cuenta, recorriendo todas las páginas de /v2/pos
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return withStation(params.id, async (token) => {
    try {
      const res = await listAllPos(token)
      return res.ok ? NextResponse.json(res.data) : res.response
    } catch (error) {
      return internalErrorResponse("Failed to fetch data from Mercado Pago API", error)
    }
  })
}

// Crea un QR (POS) con POST /v2/pos
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withStation(params.id, async (token) => {
    try {
      const res = await createPos(token, await request.json(), idempotencyKeyFrom(request))
      return res.ok ? NextResponse.json(res.data, { status: 201 }) : res.response
    } catch (error) {
      return internalErrorResponse("Failed to create POS data", error)
    }
  })
}
