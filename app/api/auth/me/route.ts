import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: "Sin sesión" }, { status: 401 })
  return NextResponse.json({ user: session.user })
}
