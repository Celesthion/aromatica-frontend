import type { ReactNode } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { ButtonSpinner } from './spinner'
import { ErrorNote } from './error-note'

export function FormDialog({
  title,
  onClose,
  onSubmit,
  submitLabel = 'Создать',
  busy,
  disabled,
  error,
  maxWidth = 'max-w-md',
  children,
}: {
  title: ReactNode
  onClose: () => void
  onSubmit: () => void
  submitLabel?: ReactNode
  busy?: boolean
  /** Валидация: true выключает submit. */
  disabled?: boolean
  error?: unknown
  maxWidth?: string
  children: ReactNode
}) {
  return (
    <Modal onClose={onClose} title={title} maxWidth={maxWidth}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!busy && !disabled) onSubmit()
        }}
      >
        {children}
        <ErrorNote error={error} />
        <div className="flex justify-center gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy || disabled}>
            {busy ? <ButtonSpinner spaced /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
