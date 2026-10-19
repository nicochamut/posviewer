"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SuccessAlert } from "@/components/SuccessAlert";
import { PosTable } from "@/components/PosTable";
import { PosDetail } from "@/components/PosDetail";
import { CreatePosDialog } from "@/components/CreatePosDialog";
import { CreateStoreForm } from "@/components/CreateStoreForm";
import { StoreResponseDialog } from "@/components/StoreResponseDialog";
import { ActionButtons } from "@/components/ActionButtons";
import { useCreateFormData } from "@/hooks/useCreateFormData";
import { useStoreFormData } from "@/hooks/useStoreFormData";
import type {
  PosResponse,
  PosResult,
  PosPayload,
  PosQrConfig,
  EditFormData,
  StoreResponse,
  Station,
} from "@/types";
import {
  fetchPosData,
  createPos,
  updatePos,
  deletePos,
  createStore,
} from "@/services/api";

interface StationQrManagerProps {
  station: Station;
}

export function StationQrManager({ station }: StationQrManagerProps) {
  // APIES de la estación = external_id en pagos
  const apiCode = station.external_id;

  // Estado general
  const [posData, setPosData] = useState<PosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Estado para POS seleccionado y edición
  const [selectedPos, setSelectedPos] = useState<PosResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    category: undefined,
    operating_mode: "",
    url: "",
  });

  // Estado para creación de POS
  const { createFormData, setCreateFormData, resetCreateFormData } =
    useCreateFormData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Estado para creación de Store
  const { storeFormData, setStoreFormData, resetStoreFormData } =
    useStoreFormData();
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeResponse, setStoreResponse] = useState<StoreResponse | null>(
    null
  );
  const [storeResponseDialogOpen, setStoreResponseDialogOpen] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);

  // Datos de la estación (vienen de pagos) para precargar los formularios
  useEffect(() => {
    setCreateFormData((prev) => ({
      ...prev,
      apiCode,
      store_id: station.store_id || prev.store_id,
    }));
    setStoreFormData((prev) => ({
      ...prev,
      name: prev.name || station.description,
      external_id: `GO${apiCode}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.id]);

  // Obtener los QRs de la estación
  const handleFetchPosData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPosData(station.id);
      setPosData(data);
      setSelectedPos(null);

      if (data.data && data.data.length > 0) {
        const firstResult = data.data[0];

        // Copiar el modo de operación de los QRs existentes para que los nuevos queden igual
        const existingMode =
          data.data.find((p) => p.config?.qr?.operating_mode)?.config?.qr
            ?.operating_mode || "";

        setCreateFormData((prev) => ({
          ...prev,
          store_id: station.store_id || firstResult.store_id || prev.store_id,
          operating_mode: existingMode,
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener los datos"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.id]);

  useEffect(() => {
    handleFetchPosData();
  }, [handleFetchPosData]);

  useEffect(() => {
    // Si editSuccess tiene un valor (no es null), configuramos un temporizador
    if (editSuccess) {
      const timer = setTimeout(() => {
        setEditSuccess(null); // Limpiamos el mensaje después de 5 segundos
      }, 5000);

      // Limpiamos el temporizador si el componente se desmonta o editSuccess cambia
      return () => clearTimeout(timer);
    }
  }, [editSuccess]);

  // Función para guardar edición de POS
  const handleSaveEdit = async (formData: EditFormData) => {
    if (!selectedPos) return;

    setLoading(true);
    setError(null);
    setEditSuccess(null);

    try {
      const updateData: PosPayload = {};
      const currentQr = selectedPos.config?.qr ?? {};
      const qrChanges: PosQrConfig = {};

      // Solo incluir campos que han cambiado (PATCH)
      if (formData.name !== selectedPos.name) {
        updateData.name = formData.name;
      }

      if (formData.category && formData.category !== currentQr.category) {
        qrChanges.category = formData.category;
      }

      if (
        formData.operating_mode &&
        formData.operating_mode !== (currentQr.operating_mode ?? "")
      ) {
        qrChanges.operating_mode = formData.operating_mode;
      }

      if (formData.url !== (currentQr.url ?? "")) {
        qrChanges.url = formData.url || null;
      }

      if (Object.keys(qrChanges).length > 0) {
        updateData.config = { qr: qrChanges };
      }

      // Si no hay cambios, no hacer la petición
      if (Object.keys(updateData).length === 0) {
        setEditSuccess("No se detectaron cambios");
        setLoading(false);
        return;
      }

      const updatedPos = await updatePos(
        station.id,
        selectedPos.id,
        updateData
      );

      // Actualizar la lista de resultados
      if (posData) {
        const updatedResults = posData.data.map((pos) =>
          pos.id === updatedPos.id ? { ...pos, ...updatedPos } : pos
        );

        setPosData({
          ...posData,
          data: updatedResults,
        });
      }

      // Actualizar el POS seleccionado (PATCH puede no devolver todos los campos)
      setSelectedPos({ ...selectedPos, ...updatedPos });
      setEditSuccess("QR actualizado correctamente");
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el QR"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar POS
  const handleDeletePos = async () => {
    if (!selectedPos) return;

    setLoading(true);
    setError(null);

    try {
      await deletePos(station.id, selectedPos.id);

      // Actualizar la lista de resultados
      if (posData) {
        const updatedResults = posData.data.filter(
          (pos) => pos.id !== selectedPos.id
        );

        setPosData({
          ...posData,
          data: updatedResults,
          paging: {
            ...posData.paging,
            total: posData.paging.total - 1,
          },
        });
      }

      setSelectedPos(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el QR");
    } finally {
      setLoading(false);
    }
  };

  // Función para crear POS
  const handleCreatePos = async () => {
    setCreateLoading(true);
    setError(null);

    try {
      // Preparar los datos para la creación
      const mode = createFormData.operating_mode;
      const qr: PosQrConfig = { category: createFormData.category };
      if (mode) qr.operating_mode = mode;
      // En pdv/standalone MP no acepta url
      if (createFormData.url && mode !== "pdv" && mode !== "standalone") {
        qr.url = createFormData.url;
      }

      const createData: PosPayload = {
        name: createFormData.name,
        external_id: createFormData.external_id,
        config: { qr },
      };
      // Se usa el store_id de MP si se conoce; si no, el external_id de la estación (GO{APIES})
      if (createFormData.store_id) {
        createData.store_id = createFormData.store_id;
      } else {
        createData.external_store_id = createFormData.external_store_id;
      }

      const newPos = await createPos(station.id, createData);

      // Actualizar la lista de resultados
      if (posData) {
        setPosData({
          ...posData,
          data: [newPos, ...posData.data],
          paging: {
            ...posData.paging,
            total: posData.paging.total + 1,
          },
        });
      }

      // Cerrar el diálogo y mostrar el nuevo QR
      setCreateDialogOpen(false);
      setSelectedPos(newPos);
      setEditSuccess("QR creado correctamente");

      // Resetear el formulario pero mantener los datos comunes
      resetCreateFormData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el QR");
    } finally {
      setCreateLoading(false);
    }
  };

  // Función para crear Store
  const handleCreateStore = async () => {
    setStoreLoading(true);
    setError(null);

    try {
      const data = await createStore(station.id, storeFormData);

      // Guardar la respuesta y mostrar el popup
      setStoreResponse(data);
      setShowStoreForm(false);
      setStoreResponseDialogOpen(true);

      // Resetear el formulario pero mantener el external_id
      resetStoreFormData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el Store");
    } finally {
      setStoreLoading(false);
    }
  };

  // Agregar una función para cerrar el panel de detalles
  const handleCloseDetails = () => {
    setSelectedPos(null);
    setIsEditing(false);
    setEditSuccess(null);
  };

  return (
    <div>

      <ErrorAlert error={error} />
      <SuccessAlert message={editSuccess} />

      <div className="flex justify-center mb-6 gap-4">
        <Button
          variant="outline"
          onClick={handleFetchPosData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>

        <CreatePosDialog
          enabled={station.has_token}
          createFormData={createFormData}
          setCreateFormData={setCreateFormData}
          onCreatePos={handleCreatePos}
          createLoading={createLoading}
          open={createDialogOpen}
          setOpen={setCreateDialogOpen}
        />

        <ActionButtons
          enabled={station.has_token}
          showStoreForm={showStoreForm}
          setShowStoreForm={setShowStoreForm}
          setError={setError}
        />

        <StoreResponseDialog
          storeResponse={storeResponse}
          open={storeResponseDialogOpen}
          setOpen={setStoreResponseDialogOpen}
        />
      </div>

      {showStoreForm && (
        <CreateStoreForm
          storeFormData={storeFormData}
          setStoreFormData={setStoreFormData}
          onCreateStore={handleCreateStore}
          onCancel={() => setShowStoreForm(false)}
          storeLoading={storeLoading}
        />
      )}

      {posData && (
        <div className={`grid md:grid-cols-3 gap-6`}>
          <div className={selectedPos ? "md:col-span-2" : "md:col-span-3"}>
            <PosTable
              results={posData.data}
              paging={posData.paging}
              onSelectPos={setSelectedPos}
            />
          </div>

          {selectedPos && (
            <div className="md:col-span-1">
              <PosDetail
                selectedPos={selectedPos}
                onEdit={handleSaveEdit}
                onDelete={handleDeletePos}
                onClose={handleCloseDetails} // Nueva prop
                loading={loading}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
