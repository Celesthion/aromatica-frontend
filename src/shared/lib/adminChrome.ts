import { createContext, useContext } from 'react'

/**
 * Части каркаса админки, которыми управляет сама страница. У кассы два независимых
 * переключателя: спрятать шапку и рейл и включить полный экран браузера.
 */
interface AdminChromeCtx {
  /** Шапка и рейл спрятаны. */
  fullscreen: boolean
  setFullscreen: (on: boolean) => void
  /** Браузер в полноэкранном режиме (Fullscreen API). */
  browserFullscreen: boolean
  setBrowserFullscreen: (on: boolean) => void
  /** Браузер только что отказал в полном экране. Несколько секунд показываем подсказку. */
  browserFullscreenBlocked: boolean
}

export const AdminChromeContext = createContext<AdminChromeCtx | null>(null)

/** Заглушка для страниц вне каркаса, например отдельного роута кассы: кнопки ничего не делают. */
const NOOP: AdminChromeCtx = {
  fullscreen: false,
  setFullscreen: () => {},
  browserFullscreen: false,
  setBrowserFullscreen: () => {},
  browserFullscreenBlocked: false,
}

export function useAdminChrome(): AdminChromeCtx {
  return useContext(AdminChromeContext) ?? NOOP
}
