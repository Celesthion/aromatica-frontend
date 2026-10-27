import { cn } from '@/shared/lib/utils'
import { amountText } from '@/shared/lib/format'

/** Знак сома (U+20C0): в системных шрифтах его нет, глиф нарисован вручную. */
function SomSign({ className }: { className?: string }) {
  return (
    <svg
      // кадр обрезан по рисунку: слева край дуги, справа её кончики, снизу низ черты
      viewBox="1.4 0.6 11.3 15.9"
      aria-hidden="true"
      focusable="false"
      // высота по прописным цифрам; черта совпадает с низом кадра и ложится на baseline
      className={cn('inline-block h-[0.72em] w-auto', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="butt"
    >
      <path d="M11.8 3.4A5.4 5.4 0 1 0 11.8 11" />
      <path d="M1.55 15.4H12.54" />
    </svg>
  )
}

/** Сумма со знаком сома; где нужна строка (печать, атрибуты), есть money() из lib/format. */
export function Money({ minor, className }: { minor: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-[0.22em] tabular-nums', className)}>
      {amountText(minor)}
      <SomSign />
    </span>
  )
}
