import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useOutsideClick } from '@/shared/lib/useOutsideClick'

interface MultiSelectOption {
  value: string
  label: string
}

/** Множественный выбор в стиле .field: выбранное чипами, список с галочками. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Выбрать…',
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false))

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const selected = options.filter((o) => value.includes(o.value))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="field flex h-auto min-h-9 w-full items-center justify-between gap-2 py-1.5 text-left"
        onClick={() => setOpen(!open)}
      >
        {selected.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selected.map((o) => (
              <span
                key={o.value}
                className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green-dark"
              >
                {o.label}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground/70">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-popover p-1 shadow-lg">
          {options.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Нет вариантов</p>}
          {options.map((o) => {
            const on = value.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                onClick={() => toggle(o.value)}
              >
                {o.label}
                {on && <Check className="h-4 w-4 text-brand-green" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
