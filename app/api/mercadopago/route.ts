import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/pos?access_token=${accessToken}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Error from Mercado Pago API", details: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from Mercado Pago API:", error)
    return NextResponse.json({ error: "Failed to fetch data from Mercado Pago API", details: error }, { status: 500 })
  }
}

// Nuevo endpoint para crear QRs
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Validar que los campos requeridos estén presentes
    const requiredFields = ["name", "fixed_amount", "category", "store_id", "external_id", "url"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 })
      }
    }

    const response = await fetch(`https://api.mercadopago.com/pos?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Error from Mercado Pago API", details: data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating Mercado Pago POS:", error)
    return NextResponse.json({ error: "Failed to create POS data", details: error }, { status: 500 })
  }
}

