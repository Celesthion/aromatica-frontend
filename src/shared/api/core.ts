import { API_BASE_URL } from '@/shared/api/http'

const TOKEN_KEY = 'storehub_token'
const REFRESH_KEY = 'storehub_refresh'

/**
 * Хранилище токенов: в вебе localStorage, мобильное приложение подставляет AsyncStorage
 * через setTokenStorage. Интерфейс синхронный, адаптер держит значения в памяти и сам пишет на диск.
 */
export interface TokenStorage {
  get(key: string): string | null
  set(key: string, value: string | null): void
}

const memoryTokens = new Map<string, string>()

// в React Native localStorage нет: до setTokenStorage токены живут в памяти
const defaultStorage: TokenStorage =
  typeof localStorage === 'undefined'
    ? {
        get: (key) => memoryTokens.get(key) ?? null,
        set: (key, value) => {
          if (value === null) memoryTokens.delete(key)
          else memoryTokens.set(key, value)
        },
      }
    : {
        get: (key) => localStorage.getItem(key),
        set: (key, value) => {
          if (value === null) localStorage.removeItem(key)
          else localStorage.setItem(key, value)
        },
      }

let tokenStorage: TokenStorage = defaultStorage

export function setTokenStorage(storage: TokenStorage): void {
  tokenStorage = storage
}

function getToken(): string | null {
  return tokenStorage.get(TOKEN_KEY)
}

function setToken(token: string | null): void {
  tokenStorage.set(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return tokenStorage.get(REFRESH_KEY)
}

function setRefreshToken(token: string | null): void {
  tokenStorage.set(REFRESH_KEY, token)
}

/** Пару токенов всегда сохраняем и сбрасываем вместе. */
export function setTokens(access: string | null, refresh: string | null): void {
  setToken(access)
  setRefreshToken(refresh)
}

// один refresh на все параллельные 401: первый обмен отзывает старый refresh,
// остальные запросы получили бы "токен уже использован"
let refreshInFlight: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  // сессию закрываем только когда сервер отверг refresh; 5xx при передеплое - обычная ошибка
  if (res.status === 400 || res.status === 401) {
    setTokens(null, null)
    return false
  }
  if (!res.ok) throw new Error(`API ${res.status}: /api/auth/refresh`)
  const data = (await res.json()) as { accessToken: string; refreshToken: string }
  setTokens(data.accessToken, data.refreshToken)
  return true
}

// access идёт в Authorization; на 401 меняем refresh на новую пару и повторяем запрос один раз
export async function adminFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = getToken()
  // для FormData Content-Type ставит браузер: ему нужно дописать boundary
  const isForm = init?.body instanceof FormData
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (res.status === 401) {
    // login и refresh не обновляем: там 401 значит неверный вход или мёртвый refresh, а /refresh
    // иначе вызывал бы сам себя; остальные /api/auth/** (например /me) обновляем,
    // с них начинается загрузка приложения
    const noRefresh = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/refresh')
    if (!retried && !noRefresh && (await refreshSession())) {
      return adminFetch(path, init, true)
    }
    setTokens(null, null)
    throw new UnauthorizedError()
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `API ${res.status}: ${path}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export interface SortParam {
  key: string
  dir: 'asc' | 'desc'
}

/** Пропускает null, undefined, '' и false; true передаётся как 'true'. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === false) continue
    sp.set(k, String(v))
  }
  const str = sp.toString()
  return str ? `?${str}` : ''
}

export const post = (data?: unknown): RequestInit => ({
  method: 'POST',
  body: data === undefined ? undefined : JSON.stringify(data),
})
export const put = (data: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(data) })
export const del = (): RequestInit => ({ method: 'DELETE' })

/**
 * В архив или обратно. Направление явное (/archive или /restore), а не переключатель:
 * повторный запрос (двойной клик, повтор сети) не вернёт запись туда, откуда её убрали.
 */
export const archiveUrl = (base: string, archived: boolean): string =>
  `${base}/${archived ? 'restore' : 'archive'}`

/** Ответ /search-эндпоинтов: Spring Page в стабильной обёртке. */
interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
}

/** Для больших списков с поиском и бесконечной прокруткой. */
export interface Paged<T> {
  items: T[]
  page: number
  totalPages: number
  totalItems: number
}

function toPaged<T>(p: PageResponse<T>): Paged<T> {
  return { items: p.content, page: p.page, totalPages: p.totalPages, totalItems: p.totalElements }
}

/** Поиск: POST на /search с фильтром, страницей и сортировкой в теле. */
export function searchPaged<T>(path: string, body: unknown): Promise<Paged<T>> {
  return adminFetch<PageResponse<T>>(path, post(body)).then(toPaged)
}

/** Страница журнала без общего числа (движения, лента): сервер говорит только, есть ли ещё. */
interface SliceResponse<T> {
  content: T[]
  page: number
  hasNext: boolean
}

export interface Sliced<T> {
  items: T[]
  page: number
  hasNext: boolean
}

function toSliced<T>(s: SliceResponse<T>): Sliced<T> {
  return { items: s.content, page: s.page, hasNext: s.hasNext }
}

export function fetchSliced<T>(path: string): Promise<Sliced<T>> {
  return adminFetch<SliceResponse<T>>(path).then(toSliced)
}

/** Ключ колонки превращается в имя enum-константы на бэке. */
export function sortBody(sort?: SortParam): { sortBy?: string; direction?: 'ASC' | 'DESC' } {
  if (!sort) return {}
  return { sortBy: sort.key.toUpperCase(), direction: sort.dir === 'desc' ? 'DESC' : 'ASC' }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Не авторизован')
    this.name = 'UnauthorizedError'
  }
}
