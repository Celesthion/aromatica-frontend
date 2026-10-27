import { useEffect, useRef } from 'react'

/** Вызывает onOutside, когда mousedown пришёл мимо элемента с возвращённым ref. */
export function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  const cb = useRef(onOutside)
  cb.current = onOutside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])
  return ref
}
