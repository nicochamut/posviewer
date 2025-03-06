import { Alert, AlertDescription } from "@/components/ui/alert"

interface SuccessAlertProps {
  message: string | null
}

export function SuccessAlert({ message }: SuccessAlertProps) {
  if (!message) return null

  return (
    <Alert className="mb-6">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

