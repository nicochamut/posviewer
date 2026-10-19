// Mismas reglas que valida el server (lib/mercadopago.ts), para avisar antes de enviar
export function validatePosName(name: string): string | null {
  if (name.length > 45) return "El nombre no puede superar 45 caracteres"
  if (name !== name.trim()) return "El nombre no puede empezar ni terminar con espacio"
  if (!/^[A-Za-z0-9_\- ]+$/.test(name))
    return "El nombre solo admite letras y números sin acentos, guiones, guiones bajos y espacios"
  return null
}

export function validatePosExternalId(externalId: string): string | null {
  if (!/^[A-Za-z0-9]+$/.test(externalId)) return "El external_id solo admite letras y números"
  if (externalId.length > 40) return "El external_id no puede superar 40 caracteres"
  return null
}
