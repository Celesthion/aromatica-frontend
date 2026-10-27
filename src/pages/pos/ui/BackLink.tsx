import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" />
      {children}
    </button>
  )
}
