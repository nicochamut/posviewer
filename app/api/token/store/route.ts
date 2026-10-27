import { type NextRequest, NextResponse } from "next/server"
import { createStore } from "@/lib/mp-ops"
import { withAccessToken } from "@/lib/token-auth"

// Alta de sucursal con un access token ingresado a mano
export async function POST(request: NextRequest) {
  return withAccessToken(request, async (token, body) => {
    const res = await createStore(token, body.store)
    return res.ok ? NextResponse.json(res.data) : res.response
  })
}
