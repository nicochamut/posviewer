"use client"

import { useState, useEffect } from "react"
import type { CreateFormData } from "@/types"

const initialCreateFormData: CreateFormData = {
  name: "",
  category: 473000,
  // Modo por defecto del instructivo; si la estación ya tiene QRs se copia el de ellos
  operating_mode: "unattended",
  store_id: "",
  external_store_id: "",
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

  // Actualizar external_id, external_store_id y url cuando cambian los campos relacionados
  useEffect(() => {
    const { apiCode, locationType, locationNumber, baseUrl } = createFormData

    if (apiCode && locationType && locationNumber && baseUrl) {
      const newExternalId = `GO${apiCode}${locationType}${locationNumber}`
      const newExternalStoreId = `GO${apiCode}`
      const newUrlSuffix = `${apiCode}/${locationType}${locationNumber}`
      const newUrl = `${baseUrl}${newUrlSuffix}`

      setCreateFormData((prev) => {
        // Solo actualizar si los valores han cambiado para evitar actualizaciones innecesarias
        if (
          prev.external_id === newExternalId &&
          prev.external_store_id === newExternalStoreId &&
          prev.urlSuffix === newUrlSuffix &&
          prev.url === newUrl
        ) {
          return prev
        }

        return {
          ...prev,
          external_id: newExternalId,
          external_store_id: newExternalStoreId,
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
