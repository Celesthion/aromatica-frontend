import { useState } from 'react'
import { Field, FormDialog, Input } from '@/shared/ui'
import { createUser, queryKeys, type Role, type WarehouseInfo } from '@/shared/api'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { PASSWORD_HINT, strongPassword } from './password'
import { StaffRoleFields } from './StaffRoleFields'

interface CreateForm {
  login: string
  password: string
  displayName: string
  role: Role
  warehouseIds: string[]
}

const EMPTY_CREATE: CreateForm = {
  login: '',
  password: '',
  displayName: '',
  role: 'SELLER',
  warehouseIds: [],
}

export function StaffCreateDialog({
  warehouses,
  onClose,
}: {
  warehouses: WarehouseInfo[]
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE)

  const create = useEntityMutation({
    mutationFn: (f: CreateForm) =>
      createUser({
        login: f.login,
        password: f.password,
        displayName: f.displayName || undefined,
        role: f.role,
        warehouseIds: f.warehouseIds,
      }),
    invalidate: [queryKeys.users.all],
    onDone: onClose,
  })

  const canCreate = form.login.trim() !== '' && strongPassword(form.password)

  return (
    <FormDialog
      title="Новый сотрудник"
      onClose={onClose}
      onSubmit={() => create.mutate(form)}
      busy={create.isPending}
      disabled={!canCreate}
      error={create.error}
    >
      <Field label="Логин">
        <Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} autoFocus />
      </Field>
      <Field label="Имя">
        <Input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Например: Айгерим"
        />
      </Field>
      <Field
        label="Пароль"
        hint={PASSWORD_HINT}
        hintTone={form.password && !strongPassword(form.password) ? 'error' : 'muted'}
      >
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </Field>
      <StaffRoleFields
        value={form}
        warehouses={warehouses}
        onChange={(patch) => setForm({ ...form, ...patch })}
      />
    </FormDialog>
  )
}
