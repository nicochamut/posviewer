"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit,
  Trash2,
  X,
  Save,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PosResult, EditFormData } from "@/types";
import { formatDate } from "@/utils/date-formatter";

interface PosDetailProps {
  selectedPos: PosResult;
  onEdit: (data: EditFormData) => void;
  onDelete: () => void;
  onClose: () => void; // Nueva prop para cerrar el panel
  loading: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editFormData: EditFormData;
  setEditFormData: (data: EditFormData) => void;
}

export function PosDetail({
  selectedPos,
  onEdit,
  onDelete,
  onClose, // Nuevo parámetro
  loading,
  isEditing,
  setIsEditing,
  editFormData,
  setEditFormData,
}: PosDetailProps) {
  // Añadir showJson al estado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleEditClick = () => {
    setEditFormData({
      name: selectedPos.name,
      fixed_amount: selectedPos.fixed_amount,
      category: selectedPos.category,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    onEdit(editFormData);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{selectedPos.name}</CardTitle>
          <CardDescription>ID: {selectedPos.id}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleEditClick}
            disabled={isEditing}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar QR</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas eliminar el QR "{selectedPos.name}
                  "? Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-fixed-amount"
                checked={editFormData.fixed_amount}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, fixed_amount: checked })
                }
              />
              <Label htmlFor="edit-fixed-amount">Monto fijo</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select
                value={editFormData.category?.toString()}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    category: Number.parseInt(value),
                  })
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="473000">
                    Playa/Surtidor (473000)
                  </SelectItem>
                  <SelectItem value="621102">Shop/Boxes (621102)</SelectItem>
                  <SelectItem value="581000">Restaurante (581000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-medium mb-2">Información General</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">User ID:</div>
                <div>{selectedPos.user_id}</div>

                <div className="text-muted-foreground">External ID:</div>
                <div>{selectedPos.external_id}</div>

                <div className="text-muted-foreground">Monto fijo:</div>
                <div>
                  <Badge
                    variant={selectedPos.fixed_amount ? "default" : "outline"}
                  >
                    {selectedPos.fixed_amount ? "Sí" : "No"}
                  </Badge>
                </div>

                {selectedPos.store_id && (
                  <>
                    <div className="text-muted-foreground">Store ID:</div>
                    <div>{selectedPos.store_id}</div>
                  </>
                )}

                {selectedPos.category && (
                  <>
                    <div className="text-muted-foreground">Categoría:</div>
                    <div>{selectedPos.category}</div>
                  </>
                )}

                <div className="text-muted-foreground">Creado:</div>
                <div>{formatDate(selectedPos.date_created)}</div>

                <div className="text-muted-foreground">Actualizado:</div>
                <div>{formatDate(selectedPos.date_last_updated)}</div>
              </div>
            </div>

            {selectedPos.qr && (
              <div>
                <h3 className="font-medium mb-2">Código QR</h3>
                <div className="flex justify-center mb-2">
                  <img
                    src={selectedPos.qr.image || "/placeholder.svg"}
                    alt={`QR para ${selectedPos.name}`}
                    className="max-w-full h-auto border rounded bg-white p-2"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedPos.qr.image, "_blank")}
                  >
                    Ver imagen QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedPos.qr.template_image, "_blank")
                    }
                  >
                    Ver plantilla (imagen)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(selectedPos.qr.template_document, "_blank")
                    }
                  >
                    Ver plantilla (PDF)
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="flex w-full justify-between items-center p-2 text-sm"
                onClick={() => setShowJson(!showJson)}
              >
                <div className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  <span>Datos JSON completos</span>
                </div>
                {showJson ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showJson && (
                <div className="mt-2 bg-muted p-3 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedPos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          Última actualización: {formatDate(selectedPos.date_last_updated)}
        </div>
      </CardFooter>
    </Card>
  );
}
