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
    fixed_amount: false,
    category: undefined,
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
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];

        // Extraer el apiCode de la URL o external_id
        let apiCode = "";
        if (firstResult.url) {
          const urlParts = firstResult.url.split("/");
          if (urlParts.length > 0) {
            apiCode = urlParts[urlParts.length - 2] || "";
          }
        } else if (firstResult.external_id) {
          // Intentar extraer el código de API del external_id (formato: GO1161pump1)
          const match = firstResult.external_id.match(/GO(\d+)/);
          if (match && match[1]) {
            apiCode = match[1];
          }
        }

        setCreateFormData((prev) => ({
          ...prev,
          store_id: firstResult.store_id || "",
          apiCode: apiCode,
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
      const updateData: Partial<EditFormData> = {};

      // Solo incluir campos que han cambiado
      if (formData.name !== selectedPos.name) {
        updateData.name = formData.name;
      }

      if (formData.fixed_amount !== selectedPos.fixed_amount) {
        updateData.fixed_amount = formData.fixed_amount;
      }

      if (formData.category !== selectedPos.category && formData.category) {
        updateData.category = formData.category;
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
        const updatedResults = posData.results.map((pos) =>
          pos.id === updatedPos.id ? updatedPos : pos
        );

        setPosData({
          ...posData,
          results: updatedResults,
        });
      }

      // Actualizar el POS seleccionado
      setSelectedPos(updatedPos);
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
        const updatedResults = posData.results.filter(
          (pos) => pos.id !== selectedPos.id
        );

        setPosData({
          ...posData,
          results: updatedResults,
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
      const createData = {
        name: createFormData.name,
        fixed_amount: createFormData.fixed_amount,
        category: createFormData.category,
        store_id: createFormData.store_id,
        external_id: createFormData.external_id,
        url: createFormData.url,
      };

      const newPos = await createPos(accessToken, createData);

      // Actualizar la lista de resultados
      if (posData) {
        setPosData({
          ...posData,
          results: [newPos, ...posData.results],
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
        Consulta de POS de Mercado Pago
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
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`md:col-span-${selectedPos ? 2 : 3}`}>
            <PosTable
              results={posData.results}
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
