import { useCallback, useEffect, useRef, useState } from 'react'

type FullscreenRoot = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FullscreenDocument = Document & { webkitExitFullscreen?: () => Promise<void> | void }

const BLOCKED_HINT_MS = 4000

/** Полный экран браузера через Fullscreen API; в Safari на iOS API нет. */
export function useBrowserFullscreen() {
  const [browserFullscreen, setBrowserFullscreenState] = useState(false)
  // подсказка об отказе гаснет сама, чтобы можно было попробовать снова
  const [browserFullscreenBlocked, setBrowserFullscreenBlocked] = useState(false)
  const blockedTimer = useRef<number | null>(null)

  // вызывать синхронно из клика, иначе браузер не увидит жеста пользователя; Safari нужен webkit-префикс
  const setBrowserFullscreen = useCallback((on: boolean) => {
    const root = document.documentElement as FullscreenRoot
    const doc = document as FullscreenDocument
    if (on) {
      if (document.fullscreenElement) return
      const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
      Promise.resolve(request?.()).catch((e: unknown) => {
        console.warn('Полный экран недоступен:', e)
        setBrowserFullscreenBlocked(true)
        if (blockedTimer.current) window.clearTimeout(blockedTimer.current)
        blockedTimer.current = window.setTimeout(() => setBrowserFullscreenBlocked(false), BLOCKED_HINT_MS)
      })
    } else if (document.fullscreenElement) {
      const exit = document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc)
      // отказ не важен: из полного экрана могли уже выйти по Esc
      Promise.resolve(exit?.()).catch(() => {})
    }
  }, [])

  // Esc выходит из полного экрана без нас, поэтому состояние берём из fullscreenchange
  useEffect(() => {
    const onChange = () => {
      setBrowserFullscreenState(document.fullscreenElement != null)
      if (document.fullscreenElement) setBrowserFullscreenBlocked(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return { browserFullscreen, setBrowserFullscreen, browserFullscreenBlocked }
}
