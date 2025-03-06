import { type NextRequest, NextResponse } from "next/server"

// Endpoint para modificar un QR específico (PUT)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const posId = params.id
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 })
  }

  try {
    const body = await request.json()

    const response = await fetch(`https://api.mercadopago.com/pos/${posId}?access_token=${accessToken}`, {
      method: "PUT",
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
    console.error("Error updating Mercado Pago POS:", error)
    return NextResponse.json({ error: "Failed to update POS data", details: error }, { status: 500 })
  }
}

// Endpoint para eliminar un QR específico (DELETE)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const posId = params.id
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/pos/${posId}?access_token=${accessToken}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: "Error from Mercado Pago API", details: errorData },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, message: "POS deleted successfully" })
  } catch (error) {
    console.error("Error deleting Mercado Pago POS:", error)
    return NextResponse.json({ error: "Failed to delete POS", details: error }, { status: 500 })
  }
}

