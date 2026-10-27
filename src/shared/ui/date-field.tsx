import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { isDateComplete, isoToMasked, maskDate, maskedToIso } from '@/shared/lib/dateMask'

/** Дата с маской "дд.мм.гггг" и календарём; наружу отдаёт ISO "гггг-мм-дд" или пустую строку. */
export function DateField({
  value,
  onChange,
  className,
  ...rest
}: {
  /** ISO "гггг-мм-дд" или пустая строка. */
  value: string
  onChange: (iso: string) => void
  className?: string
} & Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'>) {
  // пока дата не добрана, ISO пустой, поэтому текст храним отдельно
  const [text, setText] = React.useState(() => isoToMasked(value))

  // значение сменили снаружи: подхватываем, но свой же ISO не переписываем, чтобы не мешать набору
  React.useEffect(() => {
    if (maskedToIso(text) !== value) setText(isoToMasked(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleInput = (raw: string) => {
    const masked = maskDate(raw)
    setText(masked)
    onChange(maskedToIso(masked))
  }

  // дата набрана целиком, а ISO пустой: такой даты нет (31.02)
  const broken = isDateComplete(text) && maskedToIso(text) === ''

  return (
    <div className={cn('relative', className)}>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="дд.мм.гггг"
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        className={cn(
          'field flex w-full pr-10 disabled:cursor-not-allowed disabled:opacity-50',
          broken && 'border-brand-bad/60',
        )}
      />
      {/* прозрачный нативный input поверх иконки: showPicker() на скрытом поле работает не везде */}
      <span className="pointer-events-none absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground">
        <CalendarDays className="h-4 w-4" strokeWidth={1.7} />
      </span>
      <input
        type="date"
        tabIndex={-1}
        aria-label="Выбрать дату в календаре"
        value={value}
        onChange={(e) => {
          setText(isoToMasked(e.target.value))
          onChange(e.target.value)
        }}
        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 cursor-pointer opacity-0"
      />
      {broken && <span className="mt-1 block text-xs text-brand-bad">Такой даты нет</span>}
    </div>
  )
}
