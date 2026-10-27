import { Field, Input } from '@/shared/ui'
import type { DocType, MoneyAccount } from '@/shared/api'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'

function payAccountOptions(accounts: MoneyAccount[], payAccountId: string) {
  // нал идёт на счёт CASH, безнал на BANK; если таких счетов несколько, берём счёт по умолчанию
  const byType = (t: MoneyAccount['type']) =>
    accounts.find((a) => a.type === t && a.isDefault) ?? accounts.find((a) => a.type === t)
  const cashAcc = byType('CASH')
  const bankAcc = byType('BANK')
  const options: { id: string; label: string }[] = [
    { id: '', label: 'Без движения' },
    ...(cashAcc ? [{ id: cashAcc.id, label: 'Нал' }] : []),
    ...(bankAcc ? [{ id: bankAcc.id, label: 'Безнал' }] : []),
  ]
  // у сохранённого документа может быть другой счёт: показываем его отдельной опцией
  const current = payAccountId ? accounts.find((a) => a.id === payAccountId) : null
  if (current && !options.some((o) => o.id === current.id)) {
    options.push({ id: current.id, label: current.name })
  }
  return options
}

export function DocPaymentSplit({
  cashSom,
  noCashSom,
  onCash,
  onNoCash,
  readOnly,
}: {
  cashSom: string
  noCashSom: string
  onCash: (value: string) => void
  onNoCash: (value: string) => void
  readOnly: boolean
}) {
  return (
    <div className="mb-6 rounded-lg border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-medium">
        Оплата{' '}
        <span className="font-normal text-muted-foreground">
          (пусто — вся сумма наличными; разбивка должна сходиться с итогом)
        </span>
      </p>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Field label="Наличные, с">
          <Input
            inputMode="decimal"
            value={cashSom}
            onChange={(e) => onCash(e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Перевод, с">
          <Input
            inputMode="decimal"
            value={noCashSom}
            onChange={(e) => onNoCash(e.target.value)}
            disabled={readOnly}
          />
        </Field>
      </div>
    </div>
  )
}

/** Оплата выбором счёта: нал, безнал или без движения денег. */
export function DocPayAccount({
  docType,
  accounts,
  payAccountId,
  onChange,
  readOnly,
}: {
  docType: DocType
  accounts: MoneyAccount[]
  payAccountId: string
  onChange: (id: string) => void
  readOnly: boolean
}) {
  const payPill = useSlidingPill<HTMLDivElement>(payAccountId)
  const options = payAccountOptions(accounts, payAccountId)
  return (
    <div className="mb-6 max-w-sm">
      <Field label={docType === 'SUPPLY' ? 'Оплата со счёта' : 'Деньги на счёт'}>
        <div
          ref={payPill.navRef}
          className="relative inline-flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-full bg-foreground/[0.05] p-1"
        >
          {payPill.rect && (
            <span
              aria-hidden
              className="absolute rounded-full bg-card shadow-[0_1px_3px_rgba(40,40,43,0.15)]"
              style={payPill.rect}
            />
          )}
          {options.map((o) => {
            const active = payAccountId === o.id
            return (
              <button
                key={o.id || 'none'}
                type="button"
                ref={payPill.setItemRef(o.id)}
                disabled={readOnly}
                onClick={() => onChange(o.id)}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm transition-colors duration-300 disabled:opacity-60 ${
                  active ? 'font-medium text-brand-green' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </Field>
    </div>
  )
}
