"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { ErrorAlert } from "@/components/ErrorAlert"
import { StationQrManager } from "@/components/StationQrManager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchStation } from "@/services/api"
import type { Station } from "@/types"

export default function StationPage({ params }: { params: { id: string } }) {
  const [station, setStation] = useState<Station | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStation(Number(params.id))
      .then(setStation)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al obtener la estación"))
  }, [params.id])

  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 pb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Estaciones
          </Link>
        </Button>

        <ErrorAlert error={error} />

        {station && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{station.description}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                <span>
                  APIES/ID: <span className="text-foreground">{station.external_id}</span>
                </span>
                {station.flag && <span>Bandera: {station.flag}</span>}
                <span>Collector: {station.collector_id ?? "—"}</span>
                <span>Store ID: {station.store_id ?? "sin alta"}</span>
                {!station.active && <Badge variant="outline">Inactiva</Badge>}
              </div>
            </div>

            {station.has_token ? (
              <StationQrManager station={station} />
            ) : (
              <ErrorAlert error="Esta estación no tiene access token cargado en pagos.grupooleum.com.ar" />
            )}
          </>
        )}
      </main>
    </>
  )
}
