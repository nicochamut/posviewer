"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import type { CreateFormData } from "@/types";

interface CreatePosDialogProps {
  accessToken: string;
  createFormData: CreateFormData;
  setCreateFormData: (data: CreateFormData) => void;
  onCreatePos: () => void;
  createLoading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CreatePosDialog({
  accessToken,
  createFormData,
  setCreateFormData,
  onCreatePos,
  createLoading,
  open,
  setOpen,
}: CreatePosDialogProps) {
  if (!accessToken) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Crear QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo QR</DialogTitle>
          <DialogDescription>
            Complete los datos para generar un nuevo código QR.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nombre del QR</Label>
                <Input
                  id="create-name"
                  placeholder="Ej: Surtidor 1"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-category">Categoría</Label>
                <Select
                  value={createFormData.category.toString()}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      category: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="create-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="473000">
                      Playa/Surtidor (473000)
                    </SelectItem>
                    <SelectItem value="621102">Shop/Boxes (621102)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-api-code">APIES</Label>
                <Input
                  id="create-api-code"
                  placeholder="Ej: 1161"
                  value={createFormData.apiCode}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      apiCode: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-location-type">DEPARTAMENTO</Label>
                <Select
                  value={createFormData.locationType}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      locationType: value,
                    })
                  }
                >
                  <SelectTrigger id="create-location-type">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pump">Surtidor (pump)</SelectItem>
                    <SelectItem value="shop">Tienda (shop)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-location-number">Número</Label>
                <Input
                  id="create-location-number"
                  placeholder="Ej: 1"
                  value={createFormData.locationNumber}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      locationNumber: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL Generada</Label>
              <div className="flex items-center gap-1 bg-muted p-2 rounded text-sm">
                <span className="text-muted-foreground">
                  {createFormData.baseUrl}
                </span>
                <span className="font-medium">{createFormData.urlSuffix}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>External ID Generado</Label>
              <div className="bg-muted p-2 rounded text-sm font-medium">
                {createFormData.external_id}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="create-store-id">Store ID</Label>
              <Input
                id="create-store-id"
                value={createFormData.store_id}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    store_id: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                ID de la tienda obtenido de los QRs existentes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-base-url">URL Base</Label>
              <Input
                id="create-base-url"
                value={createFormData.baseUrl}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    baseUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-external-id">External ID</Label>
              <Input
                id="create-external-id"
                value={createFormData.external_id}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    external_id: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Generado automáticamente, pero puede modificarse.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-url">URL Completa</Label>
              <Input
                id="create-url"
                value={createFormData.url}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, url: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-fixed-amount"
                checked={createFormData.fixed_amount}
                onCheckedChange={(checked) =>
                  setCreateFormData({
                    ...createFormData,
                    fixed_amount: checked,
                  })
                }
              />
              <Label htmlFor="create-fixed-amount">Monto fijo</Label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onCreatePos}
            disabled={
              createLoading ||
              !createFormData.name ||
              !createFormData.external_id
            }
          >
            {createLoading ? "Creando..." : "Crear QR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
