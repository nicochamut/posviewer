"use client"

import { Button } from "@/components/ui/button"
import { Store } from "lucide-react"

interface ActionButtonsProps {
  accessToken: string
  showStoreForm: boolean
  setShowStoreForm: (show: boolean) => void
  setError: (error: string | null) => void
}

export function ActionButtons({ accessToken, showStoreForm, setShowStoreForm, setError }: ActionButtonsProps) {
  const handleStoreButtonClick = () => {
    if (!accessToken) {
      setError("Por favor ingresa un token de acceso antes de crear un Store ID")
      return
    }
    setShowStoreForm(!showStoreForm)
  }

  return (
    <div className="flex justify-center mb-6 gap-4">
      <Button variant="secondary" onClick={handleStoreButtonClick}>
        <Store className="h-4 w-4 mr-2" />
        {showStoreForm ? "Ocultar formulario" : "Crear Store ID"}
      </Button>
    </div>
  )
}

