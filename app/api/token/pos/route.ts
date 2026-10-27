import { type NextRequest, NextResponse } from "next/server"
import { idempotencyKeyFrom } from "@/lib/mercadopago"
import { createPos } from "@/lib/mp-ops"
import { withAccessToken } from "@/lib/token-auth"

// Crea un QR (POS v2) con un access token ingresado a mano
export async function POST(request: NextRequest) {
  return withAccessToken(request, async (token, body) => {
    const res = await createPos(token, body.pos, idempotencyKeyFrom(request))
    return res.ok ? NextResponse.json(res.data, { status: 201 }) : res.response
  })
}
