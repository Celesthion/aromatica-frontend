import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'

/**
 * Модалка админки и кассы: закрывается по Esc и клику в подложку, шапка с заголовком необязательна.
 * align 'top' для длинных редакторов со скроллом, 'center' для коротких диалогов.
 */
export function Modal({
  onClose,
  title,
  maxWidth = 'max-w-md',
  align = 'top',
  children,
}: {
  onClose: () => void
  title?: ReactNode
  /** Tailwind-класс ширины окна. */
  maxWidth?: string
  align?: 'top' | 'center'
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // портал в body: вложенные формы ломают submit (бренд создаётся из формы продукта)
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px]',
        align === 'top' ? 'items-start pt-10 md:pt-16' : 'items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full rounded-2xl border border-glass-edge bg-glass-panel p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_3px_rgba(0,8,20,0.2),0_32px_80px_-24px_rgba(0,8,20,0.7)] backdrop-blur-2xl backdrop-saturate-150',
          maxWidth,
        )}
      >
        {title != null && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="min-w-0 flex-1 truncate font-display text-2xl tracking-tight">{title}</h2>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
