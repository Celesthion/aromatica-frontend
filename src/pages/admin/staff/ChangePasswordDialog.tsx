import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { Field, FormDialog, Input } from '@/shared/ui'
import { changeOwnPassword } from '@/shared/api'
import { PASSWORD_HINT, strongPassword } from './password'

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [changed, setChanged] = useState(false)
  const change = useMutation({
    mutationFn: () => changeOwnPassword(current, next),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setChanged(true)
    },
  })

  return (
    <FormDialog
      title={
        <span className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Смена пароля
        </span>
      }
      onClose={onClose}
      onSubmit={() => change.mutate()}
      submitLabel={changed ? 'Готово' : 'Сохранить'}
      busy={change.isPending}
      disabled={!strongPassword(next) || !current}
      error={change.error}
      maxWidth="max-w-sm"
    >
      <Field label="Текущий пароль">
        <Input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />
      </Field>
      <Field
        label="Новый пароль"
        hint={PASSWORD_HINT}
        hintTone={next && !strongPassword(next) ? 'error' : 'muted'}
      >
        <Input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      {changed && <p className="text-sm text-brand-good">Пароль изменён.</p>}
    </FormDialog>
  )
}
