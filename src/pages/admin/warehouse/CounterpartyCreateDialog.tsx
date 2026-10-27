import { DateField, Field, FormDialog, Input } from '@/shared/ui'
import type { CounterpartyGender, CounterpartyType } from '@/shared/api'
import { PERSON_GENDER_LABELS } from '@/shared/lib/format'
import { PHONE_PREFIX, normalizePhone } from '@/shared/lib/phone'
import { COUNTERPARTY_TYPE_LABELS } from '@/pages/admin/lib/labels'

export interface NewCounterparty {
  name: string
  type: CounterpartyType
  phone: string
  // пустое значение: пол не указан, у организаций его нет
  gender: '' | CounterpartyGender
  birthDate: string
}

export const EMPTY_COUNTERPARTY: NewCounterparty = {
  name: '',
  type: 'SUPPLIER',
  phone: PHONE_PREFIX,
  gender: '',
  birthDate: '',
}

export function CounterpartyCreateDialog({
  value,
  onPatch,
  busy,
  onSubmit,
  onClose,
}: {
  value: NewCounterparty
  onPatch: (patch: Partial<NewCounterparty>) => void
  busy: boolean
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <FormDialog
      title="Новый контрагент"
      onClose={onClose}
      onSubmit={onSubmit}
      busy={busy}
      disabled={!value.name.trim() || !value.phone.trim()}
    >
      <Field label="Название">
        <Input
          value={value.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="Например: ParfumTrade KG"
          autoFocus
        />
      </Field>
      <Field label="Тип">
        <select
          className="field w-full"
          value={value.type}
          onChange={(e) => onPatch({ type: e.target.value as CounterpartyType })}
        >
          {Object.entries(COUNTERPARTY_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Телефон *">
        <Input
          value={value.phone}
          inputMode="tel"
          // как на кассе: единый формат номера, чтобы не плодить дубли
          onChange={(e) => onPatch({ phone: normalizePhone(e.target.value) })}
          required
        />
      </Field>
      <Field label="Пол">
        <select
          className="field w-full"
          value={value.gender}
          onChange={(e) => onPatch({ gender: e.target.value as '' | CounterpartyGender })}
        >
          <option value="">Не указан</option>
          {Object.entries(PERSON_GENDER_LABELS).map(([gender, label]) => (
            <option key={gender} value={gender}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Дата рождения">
        <DateField value={value.birthDate} onChange={(birthDate) => onPatch({ birthDate })} />
      </Field>
    </FormDialog>
  )
}
