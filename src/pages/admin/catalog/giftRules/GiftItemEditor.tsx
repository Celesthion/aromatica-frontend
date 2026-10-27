import { Trash2 } from 'lucide-react'
import { Input } from '@/shared/ui'
import type { ProductUnit } from '@/shared/api'
import { UNIT_LABELS } from '@/shared/lib/format'
import type { FormItem } from './giftRuleForm'
import { ProductSinglePicker } from './ProductSinglePicker'

export function GiftItemEditor({
  item,
  kinds,
  currentKindName,
  canRemove,
  onChange,
  onRemove,
}: {
  item: FormItem
  /** Формы, разрешённые в подарках. */
  kinds: { code: string; name: string; unit: ProductUnit }[]
  /** Имя формы позиции на случай, если её нет в списке. */
  currentKindName: string
  canRemove: boolean
  onChange: (patch: Partial<FormItem>) => void
  onRemove: () => void
}) {
  // форма позиции не в списке (выключена для подарков или в архиве), покажем её отдельно
  const kindMissing = item.kind !== '' && !kinds.some((k) => k.code === item.kind)
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2.5">
      <div className="flex items-center gap-2">
        <select
          className="field h-9 min-w-0 flex-1 text-sm"
          value={item.kind}
          onChange={(e) => {
            const kind = kinds.find((x) => x.code === e.target.value)
            onChange({ kind: e.target.value, unit: kind?.unit ?? 'PCS', product: null })
          }}
        >
          <option value="">Форма подарка…</option>
          {kinds.map((k) => (
            <option key={k.code} value={k.code}>
              {k.name}
            </option>
          ))}
          {kindMissing && <option value={item.kind}>{currentKindName} (недоступна)</option>}
        </select>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            className="h-9 w-20 text-right"
            inputMode="decimal"
            value={item.qty}
            onChange={(e) => onChange({ qty: e.target.value })}
            placeholder="1"
          />
          <span className="text-xs text-muted-foreground">{UNIT_LABELS[item.unit]}</span>
        </div>
        {canRemove && (
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-brand-bad"
            title="Убрать позицию"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {item.kind !== '' && (
        <div className="mt-2">
          <p className="mb-1 text-xs text-muted-foreground">
            Товар (необязательно) — без него на кассе выдадут любой товар этой формы
          </p>
          <ProductSinglePicker
            selected={item.product}
            filterKind={item.kind}
            onChange={(p) => onChange({ product: p ? { productId: p.id, name: p.name } : null })}
          />
        </div>
      )}
    </div>
  )
}
