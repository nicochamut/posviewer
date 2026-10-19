import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { PagosSessionExpired, getStationRaw, toPublicStation } from "@/lib/pagos"
import { unauthorized } from "@/lib/station-auth"
import { internalErrorResponse } from "@/lib/mercadopago"

// Datos de una estación (sin tokens)
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return unauthorized()

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Estación inválida" }, { status: 400 })

  try {
    const station = await getStationRaw(session.pagosCookie, id)
    if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 })
    return NextResponse.json(toPublicStation(station))
  } catch (error) {
    if (error instanceof PagosSessionExpired) return unauthorized()
    return internalErrorResponse("Error al obtener la estación de pagos", error)
  }
}
