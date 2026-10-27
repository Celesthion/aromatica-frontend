import { FormDialog, Field, Input } from '@/shared/ui'

export function BrandFormDialog({
  title,
  submitLabel,
  name,
  onNameChange,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  title: string
  submitLabel?: string
  name: string
  onNameChange: (name: string) => void
  busy: boolean
  error: string | null
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <FormDialog
      title={title}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      busy={busy}
      disabled={!name.trim()}
      error={error}
    >
      <Field label="Название">
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Creed" autoFocus />
      </Field>
    </FormDialog>
  )
}
