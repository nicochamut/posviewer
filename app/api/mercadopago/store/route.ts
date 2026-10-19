import { type NextRequest, NextResponse } from "next/server"
import {
  getAccessToken,
  internalErrorResponse,
  missingTokenResponse,
  mpErrorResponse,
  mpFetch,
} from "@/lib/mercadopago"

// Da de alta una estación (sucursal) con POST /users/{user_id}/stores
export async function POST(request: NextRequest) {
  const token = getAccessToken(request)
  if (!token) return missingTokenResponse()

  try {
    const body = await request.json()

    // Validar que los campos requeridos estén presentes
    const requiredFields = ["name", "external_id", "location"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 })
      }
    }

    const requiredLocationFields = [
      "zip_code",
      "street_number",
      "street_name",
      "city_name",
      "state_name",
      "latitude",
      "longitude",
    ]
    for (const field of requiredLocationFields) {
      const value = body.location[field]
      if (value === undefined || value === null || value === "" || Number.isNaN(value)) {
        return NextResponse.json({ error: `Location field '${field}' is required` }, { status: 400 })
      }
    }

    // El user_id (collector) se obtiene de la cuenta del token, no partiendo el string del token
    const me = await mpFetch("/users/me", token)
    if (!me.ok) return mpErrorResponse(me.status, me.data)
    const userId = me.data?.id
    if (!userId) {
      return NextResponse.json({ error: "No se pudo obtener el user_id de la cuenta" }, { status: 400 })
    }

    const res = await mpFetch(`/users/${userId}/stores`, token, { method: "POST", body })
    if (!res.ok) return mpErrorResponse(res.status, res.data)

    return NextResponse.json(res.data)
  } catch (error) {
    return internalErrorResponse("Failed to create Store data", error)
  }
}
