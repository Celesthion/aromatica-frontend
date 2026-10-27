import { Field } from '@/shared/ui'
import type { MoneyAccount } from '@/shared/api'

export function AccountSelect({
  label,
  accounts,
  value,
  onChange,
}: {
  label: string
  accounts: MoneyAccount[]
  value: string
  onChange: (accountId: string) => void
}) {
  return (
    <Field label={label}>
      <select className="field w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </Field>
  )
}
