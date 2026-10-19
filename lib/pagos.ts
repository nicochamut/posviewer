import crypto from "node:crypto"

// Cliente de pagos.grupooleum.com.ar (ASP.NET): login con usuario/contraseña
// y lectura de estaciones desde POST /Stations/LoadTable (el mismo JSON que usa su tabla).

export const PAGOS_URL = (process.env.PAGOS_URL || "https://pagos.grupooleum.com.ar").replace(/\/$/, "")

export class PagosAuthError extends Error {}
export class PagosSessionExpired extends Error {}

// ----- Manejo de cookies -----
type Jar = Map<string, string>

function setCookiesFrom(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof h.getSetCookie === "function") return h.getSetCookie()
  const single = res.headers.get("set-cookie")
  return single ? single.split(/,(?=\s*[^;,=\s]+=)/) : []
}

function addToJar(jar: Jar, res: Response): string[] {
  const names: string[] = []
  for (const line of setCookiesFrom(res)) {
    const pair = line.split(";")[0]
    const idx = pair.indexOf("=")
    if (idx <= 0) continue
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    names.push(name)
    if (value === "") jar.delete(name)
    else jar.set(name, value)
  }
  return names
}

function jarToHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

function extractVerificationToken(html: string): string | null {
  const input = html.match(/<input[^>]*name="__RequestVerificationToken"[^>]*>/i)?.[0]
  return input?.match(/value="([^"]+)"/i)?.[1] ?? null
}

// ----- Login -----
export async function loginToPagos(username: string, password: string): Promise<string> {
  const jar: Jar = new Map()

  const getRes = await fetch(`${PAGOS_URL}/Account/Login`, { redirect: "manual", cache: "no-store" })
  addToJar(jar, getRes)
  const html = await getRes.text()
  const verificationToken = extractVerificationToken(html)
  if (!verificationToken) throw new Error("No se encontró el formulario de login de pagos")

  const form = new URLSearchParams({
    Username: username,
    Password: password,
    RememberMe: "false",
    __RequestVerificationToken: verificationToken,
  })

  const postRes = await fetch(`${PAGOS_URL}/Account/Login`, {
    method: "POST",
    redirect: "manual",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jarToHeader(jar),
    },
    body: form.toString(),
  })
  addToJar(jar, postRes)

  // Login correcto = redirección; si vuelve el formulario (200) son credenciales inválidas
  if (postRes.status < 300 || postRes.status >= 400) {
    throw new PagosAuthError("Usuario o contraseña incorrectos")
  }

  // La cookie antifalsificación no hace falta para la sesión
  for (const name of [...jar.keys()]) {
    if (name.toLowerCase().includes("antiforgery")) jar.delete(name)
  }
  const cookieHeader = jarToHeader(jar)

  // Confirmar que la sesión realmente sirve (si redirigió de nuevo al login, no entró)
  try {
    await fetchStationsPage(cookieHeader, 0, 1)
  } catch (e) {
    if (e instanceof PagosSessionExpired) throw new PagosAuthError("Usuario o contraseña incorrectos")
    throw e
  }
  return cookieHeader
}

// ----- Estaciones -----
export interface PagosStationRaw {
  id: number
  external_id: string
  description: string
  active: boolean
  collector_id: string | null
  access_token: string | null
  storeID: string | null
  url: string | null
  last_transaction: string | null
  flag?: { name?: string; imageName?: string } | null
  [key: string]: unknown
}

// Lo que se manda al navegador: sin access_token, client_secret ni secretToken
export interface Station {
  id: number
  external_id: string
  description: string
  flag: string | null
  active: boolean
  collector_id: string | null
  store_id: string | null
  url: string | null
  last_transaction: string | null
  has_token: boolean
}

export function toPublicStation(s: PagosStationRaw): Station {
  return {
    id: s.id,
    external_id: String(s.external_id ?? ""),
    description: s.description ?? "",
    flag: s.flag?.name ?? null,
    active: !!s.active,
    collector_id: s.collector_id ?? null,
    store_id: s.storeID ?? null,
    url: s.url ?? null,
    last_transaction: s.last_transaction ?? null,
    has_token: !!s.access_token,
  }
}

async function fetchStationsPage(cookieHeader: string, start: number, length: number) {
  const body = {
    draw: 1,
    start,
    length,
    search: { value: "", regex: false },
    order: [{ column: 0, dir: "asc" }],
    columns: ["id", "external_id", "description", "flag", "url", "active", "transactionsStr", "last_transaction", "coreVersion"].map(
      (data) => ({ data, name: "", searchable: true, orderable: true, search: { value: "", regex: false } }),
    ),
  }

  const res = await fetch(`${PAGOS_URL}/Stations/LoadTable`, {
    method: "POST",
    redirect: "manual",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify(body),
  })

  // Sin sesión, pagos redirige al login
  if (res.status >= 300 && res.status < 400) throw new PagosSessionExpired("La sesión de pagos venció")
  if (res.status === 401 || res.status === 403) throw new PagosSessionExpired("La sesión de pagos venció")
  if (!res.ok) throw new Error(`pagos respondió ${res.status} al listar estaciones`)

  const text = await res.text()
  try {
    return JSON.parse(text) as { recordsTotal: number; data: PagosStationRaw[] }
  } catch {
    // Devolvió HTML (el login): sesión vencida
    throw new PagosSessionExpired("La sesión de pagos venció")
  }
}

// Caché en memoria por sesión para no pedir las 229 estaciones en cada llamada
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { at: number; stations: PagosStationRaw[] }>()

export async function loadStations(cookieHeader: string, force = false): Promise<PagosStationRaw[]> {
  const cacheKey = crypto.createHash("sha256").update(cookieHeader).digest("hex")
  const hit = cache.get(cacheKey)
  if (!force && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.stations

  const PAGE = 500
  const all: PagosStationRaw[] = []
  for (let start = 0; start < 20000; start += PAGE) {
    const page = await fetchStationsPage(cookieHeader, start, PAGE)
    all.push(...(page.data ?? []))
    if (!page.data?.length || all.length >= page.recordsTotal) break
  }

  cache.set(cacheKey, { at: Date.now(), stations: all })
  return all
}

export async function getStationRaw(cookieHeader: string, id: number): Promise<PagosStationRaw | null> {
  const stations = await loadStations(cookieHeader)
  return stations.find((s) => s.id === id) ?? null
}
