import type { ReactNode } from 'react'

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex select-none items-center gap-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-foreground/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-[0_1px_2px_rgba(40,40,43,0.35)] transition-all duration-200 ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  )
}
