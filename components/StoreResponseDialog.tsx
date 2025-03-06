"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { StoreResponse } from "@/types"
import { formatDate } from "@/utils/date-formatter"

interface StoreResponseDialogProps {
  storeResponse: StoreResponse | null
  open: boolean
  setOpen: (open: boolean) => void
}

export function StoreResponseDialog({ storeResponse, open, setOpen }: StoreResponseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Store ID Creado Exitosamente</DialogTitle>
          <DialogDescription>
            El Store ID ha sido creado correctamente. A continuación se muestra la respuesta del servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
          <pre className="text-sm">{storeResponse ? JSON.stringify(storeResponse, null, 2) : ""}</pre>
        </div>

        {storeResponse && (
          <div className="bg-primary/10 p-4 rounded-md">
            <h3 className="font-medium mb-2">Información Importante</h3>
            <p className="text-sm mb-2">Guarde esta información para futuras referencias:</p>
            <ul className="text-sm space-y-1">
              <li>
                <span className="font-medium">Store ID:</span> {storeResponse.id}
              </li>
              <li>
                <span className="font-medium">Nombre:</span> {storeResponse.name}
              </li>
              <li>
                <span className="font-medium">External ID:</span> {storeResponse.external_id}
              </li>
              <li>
                <span className="font-medium">Fecha de Creación:</span> {formatDate(storeResponse.date_created)}
              </li>
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

