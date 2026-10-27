import { useEffect, useRef, useState } from 'react'
import {
  discountMinorForPct,
  discountPctFor,
  grossMinor,
  minorToSom,
  somToMinorOr0,
} from '@/shared/lib/money'
import { money } from '@/shared/lib/format'
import type { CartLine } from '@/pages/pos/lib/types'
import { parseReceiptPct, type DiscountMode, type ReceiptDiscount } from '@/pages/pos/lib/discount'

const DARK_INPUT =
  'w-16 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-right text-[13px] tabular-nums text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30 disabled:opacity-40'

function ModeToggle({
  mode,
  onChange,
  variant,
}: {
  mode: DiscountMode
  onChange: (m: DiscountMode) => void
  variant: 'dark' | 'light'
}) {
  const dark = variant === 'dark'
  const base = dark ? 'bg-white/[0.06] text-white/45' : 'bg-foreground/[0.06] text-muted-foreground'
  const on = dark ? 'bg-white text-brand-ink' : 'bg-primary text-primary-foreground'
  return (
    <span className={`flex overflow-hidden rounded-md text-[11px] font-medium ${base}`}>
      {(['pct', 'sum'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-1.5 py-0.5 transition ${mode === m ? on : ''}`}
          title={m === 'pct' ? 'Скидка процентом' : 'Скидка суммой'}
        >
          {m === 'pct' ? '%' : 'с'}
        </button>
      ))}
    </span>
  )
}

/** Скидка строки: хранится суммой, вводится процентом или суммой; процент держится при смене количества. */
export function LineDiscountInput({
  line,
  onChange,
}: {
  line: CartLine
  onChange: (discountMinor: number) => void
}) {
  const [mode, setMode] = useState<DiscountMode>('pct')
  const [text, setText] = useState('')
  const gross = grossMinor(line.qty, line.priceMinor)
  const focused = useRef(false)
  // подхватываем внешние изменения: восстановили черновик, поменяли количество
  useEffect(() => {
    if (focused.current) return
    setText(
      line.discountMinor
        ? mode === 'pct'
          ? String(discountPctFor(line.qty, line.priceMinor, line.discountMinor))
          : minorToSom(line.discountMinor)
        : '',
    )
  }, [line.discountMinor, line.qty, line.priceMinor, mode])
  // при смене количества или цены пересчитываем сумму от введённого процента
  const pctRef = useRef<number | null>(null)
  useEffect(() => {
    if (mode !== 'pct' || pctRef.current == null) return
    const next = discountMinorForPct(line.qty, line.priceMinor, pctRef.current)
    if (next !== line.discountMinor) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.qty, line.priceMinor])

  return (
    <span className="flex items-center gap-1 text-[11px] text-white/45">
      <input
        className={`${DARK_INPUT} w-14`}
        inputMode="decimal"
        value={text}
        placeholder="0"
        onFocus={() => (focused.current = true)}
        onBlur={() => (focused.current = false)}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          if (mode === 'pct') {
            const pct = parseReceiptPct(raw)
            pctRef.current = pct
            onChange(discountMinorForPct(line.qty, line.priceMinor, pct))
          } else {
            pctRef.current = null
            onChange(Math.min(gross, somToMinorOr0(raw)))
          }
        }}
      />
      <ModeToggle
        mode={mode}
        variant="dark"
        onChange={(m) => {
          setMode(m)
          pctRef.current = null
          setText(
            line.discountMinor
              ? m === 'pct'
                ? String(discountPctFor(line.qty, line.priceMinor, line.discountMinor))
                : minorToSom(line.discountMinor)
              : '',
          )
        }}
      />
    </span>
  )
}

/** Скидка на весь чек: пресеты и поле для процента или суммы; один компонент для сводки чека и окна оплаты. */
export function ReceiptDiscountInput({
  value,
  onChange,
  amountMinor,
  variant,
}: {
  value: ReceiptDiscount
  onChange: (rd: ReceiptDiscount) => void
  /** Скидка в тыйынах, показывается рядом с процентом. */
  amountMinor: number
  variant: 'dark' | 'light'
}) {
  const dark = variant === 'dark'
  const pct = value.mode === 'pct' ? parseReceiptPct(value.value) : null
  const chip = dark
    ? { on: 'bg-white text-brand-ink', off: 'bg-white/[0.08] text-white/70 hover:bg-white/[0.14]' }
    : { on: 'bg-primary text-primary-foreground', off: 'bg-secondary hover:bg-secondary/70' }
  const input = dark
    ? 'w-16 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-right text-[12.5px] tabular-nums text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30'
    : 'field h-8 w-20 rounded-lg px-2 text-right text-sm'
  return (
    <span className="flex items-center gap-1">
      {[5, 10, 15].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange({ mode: 'pct', value: pct === v ? '' : String(v) })}
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition ${pct === v ? chip.on : chip.off}`}
        >
          {v}%
        </button>
      ))}
      <input
        inputMode="decimal"
        value={value.value}
        onChange={(e) => {
          const v = e.target.value.replace(',', '.')
          if (v === '' || /^\d*\.?\d*$/.test(v)) {
            // процент не больше 100; сумму ограничивает расчёт базой
            if (value.mode === 'pct' && (parseFloat(v) || 0) > 100) return
            onChange({ ...value, value: e.target.value })
          }
        }}
        placeholder="0"
        className={input}
      />
      <ModeToggle mode={value.mode} variant={variant} onChange={(mode) => onChange({ mode, value: '' })} />
      {amountMinor > 0 && (
        <span className={`whitespace-nowrap text-[11px] ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>
          {value.mode === 'pct' ? `= ${money(amountMinor)}` : ''}
        </span>
      )}
    </span>
  )
}
