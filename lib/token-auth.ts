import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { internalErrorResponse } from "@/lib/mercadopago"
import { validAccessToken } from "@/lib/mp-ops"
import { unauthorized } from "@/lib/station-auth"

// Rutas que trabajan con un access token ingresado a mano (estación que todavía no está en pagos).
// El token viaja en el body (nunca en la URL), se usa para esa llamada y no se guarda.
export async function withAccessToken(
  request: NextRequest,
  handler: (token: string, body: any) => Promise<Response>,
): Promise<Response> {
  if (!getSession()) return unauthorized()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const token = body?.access_token
  if (!validAccessToken(token)) {
    return NextResponse.json(
      { error: "Access token inválido: tiene que empezar con APP_USR- (o TEST-)" },
      { status: 400 },
    )
  }

  try {
    return await handler(token.trim(), body)
  } catch (error) {
    return internalErrorResponse("Error al consultar Mercado Pago", error)
  }
}
