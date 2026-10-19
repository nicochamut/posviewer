import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { PagosSessionExpired, loadStations, toPublicStation } from "@/lib/pagos"
import { unauthorized } from "@/lib/station-auth"
import { internalErrorResponse } from "@/lib/mercadopago"

// Lista todas las estaciones de pagos (sin tokens). ?refresh=1 ignora la caché.
export async function GET(request: NextRequest) {
  const session = getSession()
  if (!session) return unauthorized()

  try {
    const force = request.nextUrl.searchParams.get("refresh") === "1"
    const stations = await loadStations(session.pagosCookie, force)
    return NextResponse.json({ user: session.user, data: stations.map(toPublicStation) })
  } catch (error) {
    if (error instanceof PagosSessionExpired) return unauthorized()
    return internalErrorResponse("Error al obtener las estaciones de pagos", error)
  }
}
