"use client"

import { FileDown, ImageDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PosResult } from "@/types"

interface QrListCardProps {
  title: string
  description?: string
  items: PosResult[]
  // Columna extra por fila (por ejemplo el estado de creación en el alta)
  extra?: { header: string; render: (pos: PosResult) => React.ReactNode }
}

const categoryLabel = (c?: number) => (c === 473000 ? "Playa" : c === 621102 ? "Shop" : c ? String(c) : "—")

// Orden natural: pump1, pump2 … pump10, shop1
const byExternalId = (a: PosResult, b: PosResult) =>
  a.external_id.localeCompare(b.external_id, undefined, { numeric: true, sensitivity: "base" })

export function QrListCard({ title, description, items, extra }: QrListCardProps) {
  const sorted = [...items].sort(byExternalId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description ?? `${items.length} QR${items.length === 1 ? "" : "s"}`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>POS ID</TableHead>
                <TableHead>Store ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Mancha</TableHead>
                {extra && <TableHead>{extra.header}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((pos) => {
                const qr = pos.config?.qr
                return (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium whitespace-nowrap">{pos.name}</TableCell>
                    <TableCell className="font-mono text-xs">{pos.external_id}</TableCell>
                    <TableCell className="font-mono text-xs">{pos.id}</TableCell>
                    <TableCell className="font-mono text-xs">{pos.store_id ?? "—"}</TableCell>
                    <TableCell>{categoryLabel(qr?.category)}</TableCell>
                    <TableCell>
                      {qr?.operating_mode ? (
                        <Badge variant="outline">{qr.operating_mode}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate" title={qr?.url ?? ""}>
                      {qr?.url ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pos.qr_response?.template_document && (
                          <a
                            href={pos.qr_response.template_document}
                            target="_blank"
                            rel="noreferrer"
                            title="Mancha con plantilla (PDF)"
                            className="text-primary hover:opacity-80"
                          >
                            <FileDown className="h-4 w-4" />
                          </a>
                        )}
                        {pos.qr_response?.image && (
                          <a
                            href={pos.qr_response.image}
                            target="_blank"
                            rel="noreferrer"
                            title="QR solo (PNG)"
                            className="text-primary hover:opacity-80"
                          >
                            <ImageDown className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    {extra && <TableCell>{extra.render(pos)}</TableCell>}
                  </TableRow>
                )
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={extra ? 9 : 8} className="text-center text-muted-foreground py-6">
                    Sin QRs
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
