import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { PagosSessionExpired, getStationRaw, type PagosStationRaw } from "@/lib/pagos"
import { internalErrorResponse } from "@/lib/mercadopago"

export function unauthorized(message = "Sesión vencida, volvé a ingresar") {
  return NextResponse.json({ error: message, code: "session_expired" }, { status: 401 })
}

// Resuelve la estación y su access token desde la sesión de pagos.
// El token se usa solo del lado del servidor; nunca se devuelve al navegador.
export async function withStation(
  stationId: string,
  handler: (token: string, station: PagosStationRaw) => Promise<Response>,
): Promise<Response> {
  const session = getSession()
  if (!session) return unauthorized()

  const id = Number(stationId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Estación inválida" }, { status: 400 })
  }

  try {
    const station = await getStationRaw(session.pagosCookie, id)
    if (!station) return NextResponse.json({ error: "Estación no encontrada" }, { status: 404 })
    if (!station.access_token) {
      return NextResponse.json({ error: "La estación no tiene access token cargado en pagos" }, { status: 409 })
    }
    return await handler(station.access_token, station)
  } catch (error) {
    if (error instanceof PagosSessionExpired) return unauthorized()
    return internalErrorResponse("Error al obtener la estación desde pagos", error)
  }
}
