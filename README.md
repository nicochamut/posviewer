# posviewer

Panel interno de Grupo Oleum para dar de alta estaciones en Mercado Pago y gestionar sus QRs (uno por posición de surtidor o shop).

## API de Mercado Pago que usa

| Acción | Endpoint |
|---|---|
| Listar QRs de la estación | `GET /v2/pos` (paginado de a 30, el panel trae todas las páginas) |
| Crear QR | `POST /v2/pos` |
| Editar QR | `PATCH /v2/pos/{pos_id}` |
| Eliminar QR | `DELETE /v2/pos/{pos_id}` |
| Alta de estación | `POST /users/{user_id}/stores` (`user_id` desde `GET /users/me`) |

- El access token viaja siempre en `Authorization: Bearer`, nunca en la URL.
- Crear, editar y eliminar envían `X-Idempotency-Key`.
- Convenciones: estación `GO{APIES}`, QR `GO{APIES}{pump|shop}{n}`, URL `https://pagos.grupooleum.com.ar/api/pay/{APIES}/{pump|shop}{n}`.
- `config.qr.operating_mode` se copia de los QRs existentes al consultar la estación. En `pdv` y `standalone` Mercado Pago no acepta URL.

## Desarrollo

```bash
npm install
npm run dev
```

Para probar contra un mock en lugar de Mercado Pago: `MP_API_URL=http://localhost:4010 npm run dev`.
