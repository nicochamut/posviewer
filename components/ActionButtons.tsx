"use client"

import { Button } from "@/components/ui/button"
import { Store } from "lucide-react"

interface ActionButtonsProps {
  enabled: boolean
  showStoreForm: boolean
  setShowStoreForm: (show: boolean) => void
  setError: (error: string | null) => void
}

export function ActionButtons({ enabled, showStoreForm, setShowStoreForm, setError }: ActionButtonsProps) {
  const handleStoreButtonClick = () => {
    if (!enabled) {
      setError("La estación no tiene access token cargado en pagos")
      return
    }
    setShowStoreForm(!showStoreForm)
  }

  return (
    <div className="flex justify-center mb-6 gap-4">
      <Button variant="secondary" onClick={handleStoreButtonClick}>
        <Store className="h-4 w-4 mr-2" />
        {showStoreForm ? "Ocultar formulario" : "Dar de alta en Mercado Pago"}
      </Button>
    </div>
  )
}

