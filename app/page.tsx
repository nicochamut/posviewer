"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { KeyRound, PlusCircle, RefreshCw, Search } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { ErrorAlert } from "@/components/ErrorAlert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchStations } from "@/services/api"
import type { Station } from "@/types"

// Normaliza para buscar sin importar mayúsculas ni acentos
const norm = (v: string | null | undefined) =>
  (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [user, setUser] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [onlyActive, setOnlyActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchStations(refresh)
      setStations(res.data)
      setUser(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener las estaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const terms = norm(query).split(/\s+/).filter(Boolean)
    return stations
      .filter((s) => !onlyActive || s.active)
      .filter((s) => {
        if (terms.length === 0) return true
        const haystack = norm(
          [s.external_id, s.description, s.flag, s.collector_id, s.store_id, String(s.id)].join(" "),
        )
        return terms.every((t) => haystack.includes(t))
      })
  }, [stations, query, onlyActive])

  return (
    <>
      <AppHeader user={user} />
      <main className="container mx-auto px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Link href="/alta" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <PlusCircle className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <CardTitle className="text-base">Alta de estación nueva</CardTitle>
                  <CardDescription>
                    Con el access token del cliente: crea la sucursal (Store ID) y los QRs v2 de surtidores y shop.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/consulta" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <KeyRound className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <CardTitle className="text-base">Consultar por access token</CardTitle>
                  <CardDescription>
                    Collector ID, sucursales y todos los QRs de una cuenta, con sus manchas para descargar.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <ErrorAlert error={error} />

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Estaciones</CardTitle>
              <CardDescription>
                {loading ? "Cargando..." : `${filtered.length} de ${stations.length} estaciones`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Buscar por APIES, nombre, bandera, collector..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => load(true)} disabled={loading} title="Actualizar">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 text-sm text-muted-foreground mb-3 cursor-pointer w-fit">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Solo activas
            </label>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Externo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Bandera</TableHead>
                    <TableHead>Collector ID</TableHead>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link href={`/estacion/${s.id}`} className="hover:underline">
                          {s.external_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/estacion/${s.id}`} className="hover:underline">
                          {s.description}
                        </Link>
                      </TableCell>
                      <TableCell>{s.flag ?? "—"}</TableCell>
                      <TableCell>{s.collector_id ?? "—"}</TableCell>
                      <TableCell>{s.store_id ?? <span className="text-muted-foreground">Sin alta</span>}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={s.active ? "default" : "outline"}>{s.active ? "Activa" : "Inactiva"}</Badge>
                          {!s.has_token && <Badge variant="destructive">Sin token</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay estaciones que coincidan con la búsqueda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
