import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

// тот же ключ читает inline-скрипт в index.html, чтобы первый кадр не мигал светлым
const KEY = 'storehub_theme'

/** Тема это класс `dark` на <html>; токены под каждую тему лежат в app/styles/index.css. */
function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Выбор темы хранится в localStorage, по умолчанию тёмная. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // приватный режим: тема живёт до перезагрузки
    }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, toggle }
}
