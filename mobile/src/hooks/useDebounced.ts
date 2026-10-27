import { useEffect, useState } from 'react'

/** Значение с задержкой, чтобы поиск не дёргал бэкенд на каждую букву. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
