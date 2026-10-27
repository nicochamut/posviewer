import { type NextRequest, NextResponse } from "next/server"
import { getMe, listAllPos, listAllStores } from "@/lib/mp-ops"
import { withAccessToken } from "@/lib/token-auth"

// Consulta por access token: cuenta, sucursales y QRs
export async function POST(request: NextRequest) {
  return withAccessToken(request, async (token) => {
    const me = await getMe(token)
    if (!me.ok) return me.response

    const [stores, pos] = await Promise.all([listAllStores(token, me.data.id), listAllPos(token)])
    if (!stores.ok) return stores.response
    if (!pos.ok) return pos.response

    const u = me.data
    return NextResponse.json({
      account: {
        id: u.id,
        nickname: u.nickname ?? null,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        email: u.email ?? null,
        site_id: u.site_id ?? null,
        company: u.company?.brand_name || u.company?.corporate_name || null,
      },
      token_env: token.startsWith("TEST-") ? "test" : "production",
      stores: stores.data,
      pos: pos.data,
    })
  })
}
