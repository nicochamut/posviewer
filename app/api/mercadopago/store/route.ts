import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Extraer el collector_id del access token (está después del último guión)
    const tokenParts = accessToken.split("-")
    const collectorId = tokenParts[tokenParts.length - 1]

    if (!collectorId) {
      return NextResponse.json({ error: "Could not extract collector ID from access token" }, { status: 400 })
    }

    // Validar que los campos requeridos estén presentes
    const requiredFields = ["name", "external_id", "location"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 })
      }
    }

    // Validar campos de location
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
      if (!body.location[field]) {
        return NextResponse.json({ error: `Location field '${field}' is required` }, { status: 400 })
      }
    }

    const response = await fetch(
      `https://api.mercadopago.com/users/${collectorId}/stores?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Error from Mercado Pago API", details: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating Mercado Pago Store:", error)
    return NextResponse.json({ error: "Failed to create Store data", details: error }, { status: 500 })
  }
}

