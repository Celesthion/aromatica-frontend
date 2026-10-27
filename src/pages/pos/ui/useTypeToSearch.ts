import { useEffect, type RefObject } from 'react'
import type { SearchInputHandle } from '@/shared/ui'

// печатный символ вне полей ввода уходит в поиск (работает и со сканером)
export function useTypeToSearch(searchRef: RefObject<SearchInputHandle>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return
      const el = document.activeElement as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return
      e.preventDefault()
      searchRef.current?.append(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, searchRef])
}
