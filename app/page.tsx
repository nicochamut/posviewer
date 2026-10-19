"use client";

import { useEffect } from "react";

import { useState } from "react";
import { TokenInput } from "@/components/TokenInput";
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
} from "@/types";
import {
  fetchPosData,
  createPos,
  updatePos,
  deletePos,
  createStore,
} from "@/services/api";

export default function Home() {
  // Estado general
  const [accessToken, setAccessToken] = useState("");
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

  // Función para obtener datos de POS
  const handleFetchPosData = async () => {
    if (!accessToken) {
      setError("Por favor ingresa un token de acceso");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPosData(accessToken);
      setPosData(data);
      setSelectedPos(null);

      // Si hay resultados, extraer el store_id y otros datos comunes para el formulario de creación
      if (data.data && data.data.length > 0) {
        const firstResult = data.data[0];
        const firstUrl = firstResult.config?.qr?.url;

        // Extraer el apiCode de la URL o external_id
        let apiCode = "";
        if (firstUrl) {
          const urlParts = firstUrl.split("/");
          if (urlParts.length > 0) {
            apiCode = urlParts[urlParts.length - 2] || "";
          }
        }
        if (!apiCode && firstResult.external_id) {
          // Intentar extraer el código de API del external_id (formato: GO1161pump1)
          const match = firstResult.external_id.match(/GO(\d+)/);
          if (match && match[1]) {
            apiCode = match[1];
          }
        }

        // Copiar el modo de operación de los QRs existentes para que los nuevos queden igual
        const existingMode =
          data.data.find((p) => p.config?.qr?.operating_mode)?.config?.qr
            ?.operating_mode || "";

        setCreateFormData((prev) => ({
          ...prev,
          store_id: firstResult.store_id || "",
          apiCode: apiCode,
          operating_mode: existingMode,
        }));

        // Extraer el apiCode para el formulario de Store
        if (apiCode) {
          setStoreFormData((prev) => ({
            ...prev,
            external_id: `GO${apiCode}`,
          }));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener los datos"
      );
    } finally {
      setLoading(false);
    }
  };

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
    if (!selectedPos || !accessToken) return;

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
        accessToken,
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
    if (!selectedPos || !accessToken) return;

    setLoading(true);
    setError(null);

    try {
      await deletePos(accessToken, selectedPos.id);

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
    if (!accessToken) return;

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

      const newPos = await createPos(accessToken, createData);

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
    if (!accessToken) return;

    setStoreLoading(true);
    setError(null);

    try {
      const data = await createStore(accessToken, storeFormData);

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
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary-foreground">
        QRs de Mercado Pago
      </h1>

      <TokenInput
        accessToken={accessToken}
        setAccessToken={setAccessToken}
        onFetch={handleFetchPosData}
        loading={loading}
      />

      <ErrorAlert error={error} />
      <SuccessAlert message={editSuccess} />

      <div className="flex justify-center mb-6 gap-4">
        <CreatePosDialog
          accessToken={accessToken}
          createFormData={createFormData}
          setCreateFormData={setCreateFormData}
          onCreatePos={handleCreatePos}
          createLoading={createLoading}
          open={createDialogOpen}
          setOpen={setCreateDialogOpen}
        />

        <ActionButtons
          accessToken={accessToken}
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
    </main>
  );
}
