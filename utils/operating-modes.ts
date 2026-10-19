// Valores aceptados por Mercado Pago en config.qr.operating_mode (/v2/pos)
export const OPERATING_MODE_OPTIONS = [
  { value: "unattended", label: "Desatendido (unattended)" },
  { value: "self_service", label: "Autoservicio (self_service)" },
  { value: "pdv", label: "Atendido / punto de venta (pdv)" },
  { value: "standalone", label: "QR fijo no integrado (standalone)" },
]
