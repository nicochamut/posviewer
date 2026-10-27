"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CheckCircle2, Copy, Loader2, XCircle } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { ErrorAlert } from "@/components/ErrorAlert"
import { CreateStoreForm } from "@/components/CreateStoreForm"
import { QrListCard } from "@/components/QrListCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStoreFormData } from "@/hooks/useStoreFormData"
import { createPosWithToken, createStoreWithToken, fetchTokenInfo } from "@/services/api"
import type { MpStore, PosResult, TokenInfo } from "@/types"
import { OPERATING_MODE_OPTIONS } from "@/utils/operating-modes"

const BASE_URL = "https://pagos.grupooleum.com.ar/api/pay/"

interface PlannedQr {
  name: string
  external_id: string
  category: number
  url: string
}

type QrStatus = { state: "pending" | "creating" | "ok" | "exists" | "error"; message?: string; pos?: PosResult }

function StepTitle({ n, done, children }: { n: number; done?: boolean; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      {children}
    </CardTitle>
  )
}

export default function AltaEstacionPage() {
  const [error, setError] = useState<string | null>(null)

  // Paso 1: datos de la estación y token
  const [accessToken, setAccessToken] = useState("")
  const [apies, setApies] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [checking, setChecking] = useState(false)

  // Paso 2: sucursal
  const { storeFormData, setStoreFormData, resetStoreFormData } = useStoreFormData()
  const [storeId, setStoreId] = useState<string>("")
  const [storeLoading, setStoreLoading] = useState(false)

  // Paso 3: QRs
  const [pumps, setPumps] = useState("0")
  const [shops, setShops] = useState("0")
  const [pumpStart, setPumpStart] = useState("1")
  const [shopStart, setShopStart] = useState("1")
  const [mode, setMode] = useState("unattended")
  const [statuses, setStatuses] = useState<Record<string, QrStatus>>({})
  const [creatingQrs, setCreatingQrs] = useState(false)
  const [copied, setCopied] = useState(false)

  const cleanApies = apies.trim()
  const externalStoreId = cleanApies ? `GO${cleanApies}` : ""
  const tokenTrim = accessToken.trim()

  const existingPos = info?.pos.data ?? []
  const existingByExternalId = useMemo(() => new Map(existingPos.map((p) => [p.external_id, p])), [existingPos])
  const storeOfStation: MpStore | undefined = info?.stores.find((s) => s.external_id === externalStoreId)

  // Paso 1: validar token y traer lo que ya tiene la cuenta
  const handleCheck = async () => {
    setChecking(true)
    setError(null)
    setInfo(null)
    setStoreId("")
    setStatuses({})
    try {
      const data = await fetchTokenInfo(tokenTrim)
      setInfo(data)
      const existing = data.stores.find((s) => s.external_id === externalStoreId)
      if (existing) setStoreId(String(existing.id))
      // Si la cuenta ya tiene QRs, los nuevos van con el mismo modo
      const existingMode = data.pos.data.find((p) => p.config?.qr?.operating_mode)?.config?.qr?.operating_mode
      if (existingMode) setMode(existingMode)
      setStoreFormData({
        ...storeFormData,
        name: storeFormData.name || razonSocial.trim(),
        external_id: externalStoreId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el token")
    } finally {
      setChecking(false)
    }
  }

  // Paso 2: alta de sucursal
  const handleCreateStore = async () => {
    setStoreLoading(true)
    setError(null)
    try {
      const store = await createStoreWithToken(tokenTrim, { ...storeFormData, external_id: externalStoreId })
      setStoreId(String(store.id))
      setInfo((prev) => (prev ? { ...prev, stores: [...prev.stores, store as MpStore] } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la sucursal")
    } finally {
      setStoreLoading(false)
    }
  }

  // Paso 3: QRs a crear según las cantidades
  const planned: PlannedQr[] = useMemo(() => {
    if (!cleanApies) return []
    const list: PlannedQr[] = []
    const add = (type: "pump" | "shop", count: string, start: string) => {
      const c = Math.max(0, Math.min(99, Number.parseInt(count) || 0))
      const s = Math.max(1, Number.parseInt(start) || 1)
      for (let i = s; i < s + c; i++) {
        list.push({
          name: type === "pump" ? `Surtidor ${i}` : `Caja ${i}`,
          external_id: `GO${cleanApies}${type}${i}`,
          category: type === "pump" ? 473000 : 621102,
          url: `${BASE_URL}${cleanApies}/${type}${i}`,
        })
      }
    }
    add("pump", pumps, pumpStart)
    add("shop", shops, shopStart)
    return list
  }, [cleanApies, pumps, shops, pumpStart, shopStart])

  const toCreate = planned.filter((q) => !existingByExternalId.has(q.external_id))
  const urlAllowed = !["pdv", "standalone"].includes(mode)

  // Se crean de a uno para que un error no frene el resto y se vea el estado de cada QR
  const handleCreateQrs = async () => {
    setCreatingQrs(true)
    setError(null)
    const created: PosResult[] = []
    for (const q of toCreate) {
      if (statuses[q.external_id]?.state === "ok") continue
      setStatuses((prev) => ({ ...prev, [q.external_id]: { state: "creating" } }))
      try {
        const pos = await createPosWithToken(tokenTrim, {
          name: q.name,
          store_id: storeId,
          external_id: q.external_id,
          config: {
            qr: {
              operating_mode: mode,
              category: q.category,
              ...(urlAllowed ? { url: q.url } : {}),
            },
          },
        })
        created.push(pos)
        setStatuses((prev) => ({ ...prev, [q.external_id]: { state: "ok", pos } }))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error"
        setStatuses((prev) => ({ ...prev, [q.external_id]: { state: "error", message } }))
      }
    }
    if (created.length && info) {
      setInfo({
        ...info,
        pos: { ...info.pos, data: [...info.pos.data, ...created], paging: { ...info.pos.paging, total: info.pos.paging.total + created.length } },
      })
    }
    setCreatingQrs(false)
  }

  const allPos = existingPos.filter((p) => !storeId || p.store_id === storeId)
  const errors = Object.values(statuses).filter((s) => s.state === "error").length
  const done = !!storeId && allPos.length > 0 && toCreate.every((q) => statuses[q.external_id]?.state === "ok") && !creatingQrs

  const summaryText = info
    ? [
        `ID_Externo: ${cleanApies}`,
        `Descripción: ${razonSocial.trim()}`,
        `Collector_ID: ${info.account.id}`,
        `Store ID: ${storeId}`,
        `Access Token: ${tokenTrim}`,
      ].join("\n")
    : ""

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // sin permiso de portapapeles
    }
  }

  const step1Ready = tokenTrim && cleanApies && razonSocial.trim()

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
          <h1 className="text-2xl font-bold">Alta de estación nueva</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Para estaciones que todavía no están en pagos.grupooleum.com.ar: crea la sucursal (Store) y los QRs en
            Mercado Pago con el access token del cliente. El token no se guarda.
          </p>
        </div>

        <ErrorAlert error={error} />

        {/* Paso 1 */}
        <Card>
          <CardHeader>
            <StepTitle n={1} done={!!info}>Datos de la estación</StepTitle>
            <CardDescription>APIES, razón social y access token de producción que envía el cliente.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alta-apies">APIES</Label>
              <Input id="alta-apies" placeholder="Ej: 253" value={apies} onChange={(e) => setApies(e.target.value.replace(/\D/g, ""))} />
              <p className="text-xs text-muted-foreground">External ID de la sucursal: {externalStoreId || "GO + APIES"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alta-razon">Razón social</Label>
              <Input id="alta-razon" placeholder="Ej: DICHIARA" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alta-token">Access token</Label>
              <Input
                id="alta-token"
                type="password"
                autoComplete="off"
                placeholder="APP_USR-..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="font-mono"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            {info ? (
              <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Collector ID: <span className="text-foreground font-mono">{info.account.id}</span>
                </span>
                {info.account.nickname && <span>Cuenta: {info.account.nickname}</span>}
                <span>{info.stores.length} sucursal(es)</span>
                <span>{info.pos.paging.total} QR(s)</span>
                {info.token_env === "test" && <Badge variant="destructive">Token de prueba</Badge>}
              </div>
            ) : (
              <span />
            )}
            <Button onClick={handleCheck} disabled={!step1Ready || checking}>
              {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {info ? "Volver a consultar" : "Validar token"}
            </Button>
          </CardFooter>
        </Card>

        {/* Paso 2 */}
        {info && (
          <Card>
            <CardHeader>
              <StepTitle n={2} done={!!storeId}>Sucursal (Store ID)</StepTitle>
              <CardDescription>
                {storeId
                  ? "La estación ya tiene sucursal en Mercado Pago."
                  : `No hay sucursal con external_id ${externalStoreId}. Completá los datos para crearla.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storeId ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span>
                    Store ID: <span className="font-mono font-semibold">{storeId}</span>
                  </span>
                  {storeOfStation?.name && <span>{storeOfStation.name}</span>}
                  {storeOfStation?.location?.address_line && (
                    <span className="text-muted-foreground">{storeOfStation.location.address_line}</span>
                  )}
                </div>
              ) : (
                <>
                  {info.stores.length > 0 && (
                    <div className="mb-4 text-sm">
                      <p className="text-muted-foreground mb-2">La cuenta ya tiene estas sucursales. Si es una de estas, usala:</p>
                      <div className="flex flex-wrap gap-2">
                        {info.stores.map((s) => (
                          <Button key={s.id} variant="outline" size="sm" onClick={() => setStoreId(String(s.id))}>
                            {s.name} · {s.external_id || "sin external_id"} · {s.id}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-4">
                    Ojo: MP solo acepta ciudades de su lista y el código postal tiene que ser el de esa ciudad. Si la
                    localidad no está (ej. Monte Buey), usá la cabecera de departamento (Marcos Juárez, CP 2580) y poné
                    la localidad real en Referencia. Las coordenadas sí van las reales.
                  </p>
                  <CreateStoreForm
                    storeFormData={{ ...storeFormData, external_id: externalStoreId }}
                    setStoreFormData={setStoreFormData}
                    onCreateStore={handleCreateStore}
                    onCancel={() => resetStoreFormData(true)}
                    storeLoading={storeLoading}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Paso 3 */}
        {info && storeId && (
          <Card>
            <CardHeader>
              <StepTitle n={3} done={done}>QRs (v2)</StepTitle>
              <CardDescription>
                Un QR por cara de surtidor (pump) y por puesto de venta del shop. Los que ya existen se saltean.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="alta-pumps">Surtidores</Label>
                  <Input id="alta-pumps" type="number" min={0} max={99} value={pumps} onChange={(e) => setPumps(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alta-pump-start">Desde pump</Label>
                  <Input id="alta-pump-start" type="number" min={1} value={pumpStart} onChange={(e) => setPumpStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alta-shops">Shops</Label>
                  <Input id="alta-shops" type="number" min={0} max={99} value={shops} onChange={(e) => setShops(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alta-shop-start">Desde shop</Label>
                  <Input id="alta-shop-start" type="number" min={1} value={shopStart} onChange={(e) => setShopStart(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="alta-mode">Modo</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger id="alta-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATING_MODE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {planned.length > 0 && (
                <div className="rounded-md border divide-y text-sm">
                  {planned.map((q) => {
                    const exists = existingByExternalId.get(q.external_id)
                    const st = statuses[q.external_id]
                    return (
                      <div key={q.external_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                        <span className="w-24 font-medium">{q.name}</span>
                        <span className="font-mono text-xs w-32">{q.external_id}</span>
                        <span className="text-xs text-muted-foreground flex-1 min-w-[200px] truncate">
                          {urlAllowed ? q.url : "sin URL (modo " + mode + ")"}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          {exists ? (
                            <Badge variant="outline">Ya existe · {exists.id}</Badge>
                          ) : st?.state === "creating" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : st?.state === "ok" ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> {st.pos?.id}
                            </>
                          ) : st?.state === "error" ? (
                            <>
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-destructive max-w-[320px] truncate" title={st.message}>
                                {st.message?.split("\n")[1] || st.message}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">A crear</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {toCreate.length} a crear{errors ? ` · ${errors} con error (reintentá)` : ""}
              </span>
              <Button onClick={handleCreateQrs} disabled={creatingQrs || toCreate.length === 0 || done}>
                {creatingQrs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {errors ? "Reintentar con error" : `Crear ${toCreate.length} QR${toCreate.length === 1 ? "" : "s"}`}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Paso 4 */}
        {info && storeId && allPos.length > 0 && (
          <>
            <QrListCard
              title="QRs de la sucursal"
              description={`${allPos.length} QR(s) en el Store ${storeId}. Las manchas se bajan desde cada fila.`}
              items={allPos}
            />

            <Card>
              <CardHeader>
                <StepTitle n={4} done={false}>Cargar en el Master Server</StepTitle>
                <CardDescription>
                  Dar de alta la estación en pagos.grupooleum.com.ar (Nueva estación) con estos datos. Client ID y Client
                  Secret los manda el cliente; la URL es el DynDNS que pasa técnica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 font-mono text-sm space-y-1">
                  <div>ID_Externo: {cleanApies}</div>
                  <div>Descripción: {razonSocial.trim()}</div>
                  <div>Collector_ID: {info.account.id}</div>
                  <div>Store ID: {storeId}</div>
                  <div>Access Token: {tokenTrim.slice(0, 16)}…{tokenTrim.slice(-10)}</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={copySummary}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copiado" : "Copiar datos"}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </main>
    </>
  )
}
