/** Базовый URL бэкенда, переопределяется через VITE_API_URL. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
