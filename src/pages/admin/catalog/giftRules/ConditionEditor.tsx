import { Trash2 } from 'lucide-react'
import { Input } from '@/shared/ui'
import type { GiftConditionType } from '@/shared/api'
import type { FormCondition } from './giftRuleForm'
import { ProductSinglePicker } from './ProductSinglePicker'

const CONDITION_TYPES: { value: GiftConditionType; label: string }[] = [
  { value: 'SUM', label: 'Сумма чека' },
  { value: 'KIND', label: 'Форма товара' },
  { value: 'PRODUCT', label: 'Конкретный товар' },
]

export function ConditionEditor({
  cond,
  kinds,
  archivedKind,
  canRemove,
  onChange,
  onRemove,
}: {
  cond: FormCondition
  kinds: { code: string; name: string }[]
  /** Имя выбранной формы, если она в архиве: показываем её с пометкой. */
  archivedKind: string | null
  canRemove: boolean
  onChange: (patch: Partial<FormCondition>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2.5">
      <div className="flex items-center gap-2">
        <select
          className="field h-9 flex-1 text-sm"
          value={cond.type}
          onChange={(e) => onChange({ type: e.target.value as GiftConditionType })}
        >
          {CONDITION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-brand-bad"
            title="Убрать условие"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {cond.type === 'SUM' && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">от</span>
          <Input
            className="h-9"
            inputMode="decimal"
            value={cond.sumSom}
            onChange={(e) => onChange({ sumSom: e.target.value })}
            placeholder="1000"
          />
          <span className="text-sm text-muted-foreground">сом</span>
        </div>
      )}

      {cond.type === 'KIND' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            className="field h-9 text-sm"
            value={cond.kind}
            onChange={(e) => onChange({ kind: e.target.value })}
          >
            <option value="">форма товара…</option>
            {kinds.map((k) => (
              <option key={k.code} value={k.code}>
                {k.name}
              </option>
            ))}
            {cond.kind && archivedKind && <option value={cond.kind}>{archivedKind} (в архиве)</option>}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-muted-foreground">от</span>
            <Input
              className="h-9"
              inputMode="decimal"
              value={cond.minVolumeMl}
              onChange={(e) => onChange({ minVolumeMl: e.target.value })}
              placeholder="объём"
            />
            <span className="shrink-0 text-xs text-muted-foreground">мл</span>
          </div>
        </div>
      )}

      {cond.type === 'PRODUCT' && (
        <div className="mt-2">
          <ProductSinglePicker
            selected={cond.product}
            onChange={(p) => onChange({ product: p ? { productId: p.id, name: p.name } : null })}
          />
        </div>
      )}
    </div>
  )
}
