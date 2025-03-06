"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StoreFormData } from "@/types"

interface CreateStoreFormProps {
  storeFormData: StoreFormData
  setStoreFormData: (data: StoreFormData) => void
  onCreateStore: () => void
  onCancel: () => void
  storeLoading: boolean
}

export function CreateStoreForm({
  storeFormData,
  setStoreFormData,
  onCreateStore,
  onCancel,
  storeLoading,
}: CreateStoreFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Crear Nuevo Store ID</CardTitle>
        <CardDescription>Complete los datos para generar un nuevo Store ID para la estación.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nombre de la Estación</Label>
            <Input
              id="store-name"
              placeholder="Ej: Roma Combustibles (Parador YPF)"
              value={storeFormData.name}
              onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Razón Social (Sucursal física si tiene más de una)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-external-id">External ID</Label>
            <Input
              id="store-external-id"
              placeholder="Ej: GO102"
              value={storeFormData.external_id}
              onChange={(e) => setStoreFormData({ ...storeFormData, external_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Valor compuesto por GO+APIES</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-zip-code">Código Postal</Label>
            <Input
              id="store-zip-code"
              placeholder="Ej: 2600"
              value={storeFormData.location.zip_code}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, zip_code: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-street-number">Número de Calle</Label>
            <Input
              id="store-street-number"
              placeholder="Ej: 3680"
              value={storeFormData.location.street_number}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, street_number: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="store-street-name">Nombre de Calle</Label>
            <Input
              id="store-street-name"
              placeholder="Ej: Avenida Marcos Ciani"
              value={storeFormData.location.street_name}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, street_name: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-city-name">Ciudad</Label>
            <Input
              id="store-city-name"
              placeholder="Ej: Venado Tuerto"
              value={storeFormData.location.city_name}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, city_name: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-state-name">Provincia</Label>
            <Input
              id="store-state-name"
              placeholder="Ej: Santa Fe"
              value={storeFormData.location.state_name}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, state_name: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-latitude">Latitud</Label>
            <Input
              id="store-latitude"
              placeholder="Ej: -33.7255129"
              value={storeFormData.location.latitude}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, latitude: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground">Coordenada de Google Maps</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-longitude">Longitud</Label>
            <Input
              id="store-longitude"
              placeholder="Ej: -61.9973487"
              value={storeFormData.location.longitude}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, longitude: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground">Coordenada de Google Maps</p>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="store-reference">Referencia</Label>
            <Input
              id="store-reference"
              placeholder="Ej: Ruta 8 y 33"
              value={storeFormData.location.reference}
              onChange={(e) =>
                setStoreFormData({
                  ...storeFormData,
                  location: { ...storeFormData.location, reference: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground">Datos de referencia de ubicación</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onCreateStore} disabled={storeLoading || !storeFormData.name || !storeFormData.external_id}>
          {storeLoading ? "Creando..." : "Crear Store ID"}
        </Button>
      </CardFooter>
    </Card>
  )
}

