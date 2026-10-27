import { createContext, useContext, useEffect } from 'react'

/** Контекст слота фаст-вью в каркасе: страница открывает слот и рисует в него через портал. */
interface FastViewCtx {
  slot: HTMLElement | null
  setOpen: (open: boolean) => void
}

export const FastViewContext = createContext<FastViewCtx | null>(null)

function useFastView(): FastViewCtx {
  const ctx = useContext(FastViewContext)
  if (!ctx) throw new Error('useFastView должен использоваться внутри AdminShell')
  return ctx
}

export function useFastViewOpen(open: boolean): HTMLElement | null {
  const fastView = useFastView()
  useEffect(() => {
    fastView.setOpen(open)
    return () => fastView.setOpen(false)
  }, [open, fastView])
  return fastView.slot
}
