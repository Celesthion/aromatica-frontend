import { useState, type ReactNode } from 'react'

type Side = 'right' | 'left' | 'top' | 'bottom'

const POSITION: Record<Side, string> = {
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
}

/** Подсказка без задержки браузерного title; видимость на состоянии React, а не на group-hover. */
export function Tooltip({
  label,
  side = 'right',
  children,
}: {
  label: string
  side?: Side
  children: ReactNode
}) {
  const [shown, setShown] = useState(false)

  return (
    <span
      className="relative flex"
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
      onFocusCapture={() => setShown(true)}
      onBlurCapture={() => setShown(false)}
    >
      {children}
      {shown && label && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md ${POSITION[side]}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
