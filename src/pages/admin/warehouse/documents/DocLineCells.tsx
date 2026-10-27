import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input } from '@/shared/ui'

/** Числовая ячейка строки документа: поле у черновика, текст у проведённого. */
export function LineNumCell({
  readOnly,
  value,
  display = value,
  onChange,
}: {
  readOnly: boolean
  value: string
  display?: ReactNode
  onChange: (value: string) => void
}) {
  return (
    <td className="px-4 py-2 text-right">
      {readOnly ? (
        <span className="tabular-nums">{display}</span>
      ) : (
        <Input
          className="h-8 text-right"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </td>
  )
}

export function RemoveLineCell({ onRemove }: { onRemove: () => void }) {
  return (
    <td className="px-2 py-2">
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </td>
  )
}
