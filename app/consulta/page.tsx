"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Search } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { ErrorAlert } from "@/components/ErrorAlert"
import { QrListCard } from "@/components/QrListCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchTokenInfo } from "@/services/api"
import type { TokenInfo } from "@/types"
import { formatDate } from "@/utils/date-formatter"

export default function ConsultaTokenPage() {
  const [accessToken, setAccessToken] = useState("")
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      setInfo(await fetchTokenInfo(accessToken.trim()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el token")
    } finally {
      setLoading(false)
    }
  }

  // QRs agrupados por sucursal (los que no tienen store quedan aparte)
  const groups = useMemo(() => {
    if (!info) return []
    const byStore = new Map<string, typeof info.pos.data>()
    for (const p of info.pos.data) {
      const key = p.store_id ?? ""
      byStore.set(key, [...(byStore.get(key) ?? []), p])
    }
    const out = info.stores.map((s) => ({ store: s, items: byStore.get(String(s.id)) ?? [] }))
    const known = new Set(info.stores.map((s) => String(s.id)))
    for (const [key, items] of byStore) if (!known.has(key)) out.push({ store: null as any, items })
    return out
  }, [info])

  const a = info?.account
  const fullName = [a?.first_name, a?.last_name].filter(Boolean).join(" ")

  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 pb-8 space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Inicio
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Consultar por access token</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Muestra la cuenta, las sucursales y todos los QRs asociados a un access token de Mercado Pago. Solo lectura;
            el token no se guarda.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="password"
            autoComplete="off"
            placeholder="APP_USR-..."
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="font-mono"
          />
          <Button type="submit" disabled={!accessToken.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Consultar
          </Button>
        </form>

        <ErrorAlert error={error} />

        {info && a && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Cuenta
                  {info.token_env === "test" && <Badge variant="destructive">Token de prueba</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Collector ID (user_id)</dt>
                    <dd className="font-mono font-semibold">{a.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nickname</dt>
                    <dd>{a.nickname ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Titular</dt>
                    <dd>{a.company || fullName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{a.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sucursales</dt>
                    <dd>{info.stores.length}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">QRs</dt>
                    <dd>{info.pos.paging.total}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sucursales</CardTitle>
                <CardDescription>Store ID es el que se carga en el Master Server.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>External ID</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Creada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {info.stores.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono font-semibold">{s.id}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell className="font-mono text-xs">{s.external_id ?? "—"}</TableCell>
                          <TableCell className="text-xs">{s.location?.address_line ?? "—"}</TableCell>
                          <TableCell className="text-xs">{s.location?.reference ?? "—"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {s.date_creation ? formatDate(s.date_creation) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {info.stores.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            La cuenta no tiene sucursales
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {groups.map((g) => (
              <QrListCard
                key={g.store ? String(g.store.id) : "sin-store"}
                title={g.store ? `QRs · ${g.store.name} (${g.store.id})` : "QRs sin sucursal conocida"}
                items={g.items}
              />
            ))}
          </>
        )}
      </main>
    </>
  )
}
