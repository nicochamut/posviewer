"use client"

import { useState } from "react"
import type { StoreFormData } from "@/types"

const initialStoreFormData: StoreFormData = {
  name: "",
  external_id: "",
  location: {
    zip_code: "",
    street_number: "",
    street_name: "",
    city_name: "",
    state_name: "",
    latitude: "",
    longitude: "",
    reference: "",
  },
}

export function useStoreFormData() {
  const [storeFormData, setStoreFormData] = useState<StoreFormData>(initialStoreFormData)

  const resetStoreFormData = (keepExternalId = true) => {
    if (keepExternalId) {
      const currentExternalId = storeFormData.external_id
      setStoreFormData({
        ...initialStoreFormData,
        external_id: currentExternalId,
      })
    } else {
      setStoreFormData(initialStoreFormData)
    }
  }

  return {
    storeFormData,
    setStoreFormData,
    resetStoreFormData,
  }
}

