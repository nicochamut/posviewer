# posviewer

Panel interno de Grupo Oleum para dar de alta estaciones en Mercado Pago y gestionar sus QRs (uno por posición de surtidor o shop).

## Cómo funciona

1. **Login** (`/login`): se ingresa con el usuario de pagos.grupooleum.com.ar. El backend se loguea en pagos y guarda esa sesión cifrada (AES-256-GCM) en una cookie `httpOnly`. La contraseña no se guarda.
2. **Estaciones** (`/`): lista todas las estaciones de pagos, leídas de `POST /Stations/LoadTable`, con buscador por APIES, nombre, bandera, collector o store ID.
3. **Estación** (`/estacion/[id]`): QRs de la estación (listar, crear, editar, eliminar) y alta de la sucursal en Mercado Pago.
4. **Alta de estación nueva** (`/alta`): para estaciones que todavía no están en pagos. Con el access token del cliente valida la cuenta, crea la sucursal (o reutiliza la que ya tiene `GO{APIES}`), crea en lote los QRs de surtidores y shop (salteando los que ya existen) y deja listos los datos para cargar en el Master Server.
5. **Consultar por access token** (`/consulta`): cuenta (collector ID), sucursales y todos los QRs de un token, con links a las manchas.

El access token de cada estación se toma de pagos **del lado del servidor** y nunca llega al navegador. En `/alta` y `/consulta` el token lo ingresa el usuario: viaja en el body (nunca en la URL), se usa para esa llamada y no se guarda. La lista de estaciones se cachea 5 minutos por sesión (el botón de actualizar la fuerza).

## API de Mercado Pago que usa

| Acción | Endpoint |
|---|---|
| Listar QRs de la estación | `GET /v2/pos` (paginado de a 30, el panel trae todas las páginas) |
| Crear QR | `POST /v2/pos` |
| Editar QR | `PATCH /v2/pos/{pos_id}` |
| Eliminar QR | `DELETE /v2/pos/{pos_id}` |
| Alta de estación | `POST /users/{user_id}/stores` (`user_id` desde `GET /users/me`) |
| Listar sucursales | `GET /users/{user_id}/stores/search` |

- Token en `Authorization: Bearer` y `X-Idempotency-Key` en crear, editar y eliminar.
- Convenciones: estación `GO{APIES}`, QR `GO{APIES}{pump|shop}{n}`, URL `https://pagos.grupooleum.com.ar/api/pay/{APIES}/{pump|shop}{n}`.
- `config.qr.operating_mode` se copia de los QRs existentes de la estación. En `pdv` y `standalone` Mercado Pago no acepta URL.
- En v2 no existe `fixed_amount`: el body es `name`, `store_id`, `external_id` y `config.qr` (`operating_mode`, `category`, `url`). Categoría 473000 para playa y 621102 para shop/boxes. Modo por defecto `unattended`.
- En el alta de sucursal MP solo acepta ciudades de su lista y el código postal tiene que ser el de esa ciudad. Si la localidad no figura, usar la cabecera de departamento con su CP y poner la localidad real en `reference`.
- El Store ID que devuelve el alta de la sucursal hay que cargarlo a mano en la estación en pagos.

## Configuración

Copiar `.env.example` a `.env.local` y completar `SESSION_SECRET` (`openssl rand -base64 48`). Sin esa variable el login no funciona.

## Desarrollo

```bash
npm install
npm run dev
```

Para probar contra mocks: `PAGOS_URL=http://localhost:4020 MP_API_URL=http://localhost:4010 npm run dev`.
