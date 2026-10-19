# posviewer

Panel interno de Grupo Oleum para dar de alta estaciones en Mercado Pago y gestionar sus QRs (uno por posición de surtidor o shop).

## Cómo funciona

1. **Login** (`/login`): se ingresa con el usuario de pagos.grupooleum.com.ar. El backend se loguea en pagos y guarda esa sesión cifrada (AES-256-GCM) en una cookie `httpOnly`. La contraseña no se guarda.
2. **Estaciones** (`/`): lista todas las estaciones de pagos, leídas de `POST /Stations/LoadTable`, con buscador por APIES, nombre, bandera, collector o store ID.
3. **Estación** (`/estacion/[id]`): QRs de la estación (listar, crear, editar, eliminar) y alta de la sucursal en Mercado Pago.

El access token de cada estación se toma de pagos **del lado del servidor** y nunca llega al navegador. La lista de estaciones se cachea 5 minutos por sesión (el botón de actualizar la fuerza).

## API de Mercado Pago que usa

| Acción | Endpoint |
|---|---|
| Listar QRs de la estación | `GET /v2/pos` (paginado de a 30, el panel trae todas las páginas) |
| Crear QR | `POST /v2/pos` |
| Editar QR | `PATCH /v2/pos/{pos_id}` |
| Eliminar QR | `DELETE /v2/pos/{pos_id}` |
| Alta de estación | `POST /users/{user_id}/stores` (`user_id` desde `GET /users/me`) |

- Token en `Authorization: Bearer` y `X-Idempotency-Key` en crear, editar y eliminar.
- Convenciones: estación `GO{APIES}`, QR `GO{APIES}{pump|shop}{n}`, URL `https://pagos.grupooleum.com.ar/api/pay/{APIES}/{pump|shop}{n}`.
- `config.qr.operating_mode` se copia de los QRs existentes de la estación. En `pdv` y `standalone` Mercado Pago no acepta URL.
- El Store ID que devuelve el alta de la sucursal hay que cargarlo a mano en la estación en pagos.

## Configuración

Copiar `.env.example` a `.env.local` y completar `SESSION_SECRET` (`openssl rand -base64 48`). Sin esa variable el login no funciona.

## Desarrollo

```bash
npm install
npm run dev
```

Para probar contra mocks: `PAGOS_URL=http://localhost:4020 MP_API_URL=http://localhost:4010 npm run dev`.
