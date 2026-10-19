import { type NextRequest, NextResponse } from "next/server"
import { PagosAuthError, loginToPagos } from "@/lib/pagos"
import { setSession } from "@/lib/session"

// Ingresa a pagos.grupooleum.com.ar con el usuario de pagos y guarda esa sesión (cifrada) en una cookie.
// La contraseña solo se usa para este login y no se guarda.
export async function POST(request: NextRequest) {
  let username = ""
  let password = ""
  try {
    const body = await request.json()
    username = String(body.username ?? "").trim()
    password = String(body.password ?? "")
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Ingresá usuario y contraseña" }, { status: 400 })
  }

  try {
    const pagosCookie = await loginToPagos(username, password)
    setSession(username, pagosCookie)
    return NextResponse.json({ ok: true, user: username })
  } catch (error) {
    if (error instanceof PagosAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error en login contra pagos:", error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "No se pudo conectar con pagos.grupooleum.com.ar", details }, { status: 502 })
  }
}
