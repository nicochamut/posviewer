import { type NextRequest, NextResponse } from "next/server"
import { internalErrorResponse } from "@/lib/mercadopago"
import { createStore } from "@/lib/mp-ops"
import { withStation } from "@/lib/station-auth"

// Da de alta la sucursal de una estación de pagos con POST /users/{user_id}/stores
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withStation(params.id, async (token) => {
    try {
      const res = await createStore(token, await request.json())
      return res.ok ? NextResponse.json(res.data) : res.response
    } catch (error) {
      return internalErrorResponse("Failed to create Store data", error)
    }
  })
}
