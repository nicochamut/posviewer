"use client"

import { useState, useEffect } from "react"
import type { CreateFormData } from "@/types"

const initialCreateFormData: CreateFormData = {
  name: "",
  fixed_amount: true,
  category: 473000,
  store_id: "",
  external_id: "",
  url: "",
  urlSuffix: "",
  baseUrl: "https://pagos.grupooleum.com.ar/api/pay/",
  apiCode: "",
  locationType: "pump",
  locationNumber: "1",
}

export function useCreateFormData() {
  const [createFormData, setCreateFormData] = useState<CreateFormData>(initialCreateFormData)

  // Actualizar external_id y url cuando cambian los campos relacionados
  useEffect(() => {
    const { apiCode, locationType, locationNumber, baseUrl } = createFormData

    if (apiCode && locationType && locationNumber && baseUrl) {
      const newExternalId = `GO${apiCode}${locationType}${locationNumber}`
      const newUrlSuffix = `${apiCode}/${locationType}${locationNumber}`
      const newUrl = `${baseUrl}${newUrlSuffix}`

      // Usar una función de actualización para evitar dependencias circulares
      setCreateFormData((prev) => {
        // Solo actualizar si los valores han cambiado para evitar actualizaciones innecesarias
        if (prev.external_id === newExternalId && prev.urlSuffix === newUrlSuffix && prev.url === newUrl) {
          return prev // No hay cambios, devolver el estado anterior
        }

        return {
          ...prev,
          external_id: newExternalId,
          urlSuffix: newUrlSuffix,
          url: newUrl,
        }
      })
    }
  }, [createFormData])

  const resetCreateFormData = (keepCommonData = true) => {
    if (keepCommonData) {
      setCreateFormData((prev) => ({
        ...prev,
        name: "",
        urlSuffix: "",
        locationNumber: String(Number.parseInt(prev.locationNumber) + 1),
      }))
    } else {
      setCreateFormData(initialCreateFormData)
    }
  }

  return {
    createFormData,
    setCreateFormData,
    resetCreateFormData,
  }
}

