import { useState } from 'react'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { Modal } from '@/shared/ui'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import type { PosProduct } from '@/shared/api'
import type { ProductGroup } from '@/pages/pos/lib/types'

const isVolume = (s: string) => /^\d+([.,]\d+)?\s*мл$/i.test(s.trim())

/** Варианты продукта одной формы (объёмы, расфасовки); выбранный уходит в чек, мл-вариант в налив. */
export function VariantPicker({
  group,
  formLabel,
  accent,
  icon: Icon,
  inCartQty,
  onPick,
  onClose,
}: {
  group: ProductGroup
  /** Название формы группы, его вырезаем из подписи варианта. */
  formLabel: string
  /** Цвет и иконка формы для плитки у строк варианта. */
  accent: string
  icon: LucideIcon
  inCartQty: (id: string) => number
  onPick: (product: PosProduct) => void
  onClose: () => void
}) {
  // выбранный объём, если на нём несколько товаров (цветов)
  const [volumeStep, setVolumeStep] = useState<string | null>(null)
  const variants = [...group.variants].sort(
    (a, b) => (a.volumeMl ?? 0) - (b.volumeMl ?? 0) || a.name.localeCompare(b.name),
  )
  // отличие варианта кроме объёма: имя без модели, формы и объёма; пусто, если отличается только объём
  const distinctionOf = (p: PosProduct) => {
    const label = p.label?.trim()
    if (label) return label
    let s = p.name
    const at = group.model ? s.indexOf(group.model) : -1
    if (at >= 0) s = s.slice(at + group.model.length)
    return s
      .split(' · ')
      .map((t) => t.trim())
      .filter((t) => t && t !== formLabel && !isVolume(t))
      .join(' · ')
  }
  const priceOf = (p: PosProduct) =>
    p.priceMinor == null ? '—' : p.unit === 'ML' ? `${money(p.priceMinor)}/мл` : money(p.priceMinor)

  // при нескольких объёмах сначала выбирают объём, потом товар на нём (например, цвет)
  const byVolume = new Map<string, PosProduct[]>()
  for (const p of variants) {
    const k = p.volumeMl != null ? qtyFmt(p.volumeMl) : ''
    const arr = byVolume.get(k)
    if (arr) arr.push(p)
    else byVolume.set(k, [p])
  }
  const volumeKeys = [...byVolume.keys()].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0))
  const multiVolume = volumeKeys.length > 1
  const singleVolume = volumeKeys.length === 1 && volumeKeys[0] !== '' ? volumeKeys[0] : null

  const showVolumes = multiVolume && volumeStep === null
  const items = multiVolume ? (byVolume.get(volumeStep ?? '') ?? []) : variants
  const itemLabel = (p: PosProduct) =>
    distinctionOf(p) || (p.volumeMl != null ? `${qtyFmt(p.volumeMl)} мл` : p.name)

  return (
    <Modal align="center" maxWidth="max-w-lg" onClose={onClose} title={group.title}>
      {/* при выборе цвета вместо чипа формы кнопка назад к объёмам */}
      <div className="mb-3 flex items-center gap-2">
        {volumeStep !== null ? (
          <button
            type="button"
            onClick={() => setVolumeStep(null)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[12.5px] font-medium text-foreground/70 transition hover:bg-secondary/70"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {volumeStep} мл
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium"
            style={{ backgroundColor: `${accent}1f`, color: accent }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
            {formLabel}
          </span>
        )}
        {volumeStep === null && singleVolume != null && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[12.5px] font-medium text-foreground/70">
            {singleVolume} мл
          </span>
        )}
        <span className="ml-auto text-[12.5px] text-muted-foreground">
          {showVolumes ? 'Выберите объём' : 'Выберите вариант'}
        </span>
      </div>

      <div className="-mr-1 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {showVolumes
          ? volumeKeys.map((k) => {
              const atVolume = byVolume.get(k) ?? []
              const left = atVolume.reduce((s, p) => s + (p.qty - inCartQty(p.id)), 0)
              const many = atVolume.length > 1
              return (
                <VariantRow
                  key={k || 'novol'}
                  accent={accent}
                  icon={Icon}
                  disabled={left <= 0}
                  // один товар сразу в чек, несколько ведут к выбору цвета
                  onClick={() => (atVolume.length === 1 ? onPick(atVolume[0]) : setVolumeStep(k))}
                  title={k ? `${k} мл` : 'Без объёма'}
                  sub={
                    left <= 0
                      ? 'нет в наличии'
                      : many
                        ? `${atVolume.length} вариантов`
                        : `остаток ${qtyFmt(left)}`
                  }
                  subDanger={left <= 0}
                  // у цветов цена своя у каждого, поэтому показываем её только для одного товара
                  right={many ? '' : priceOf(atVolume[0])}
                />
              )
            })
          : items.map((p) => {
              const left = p.qty - inCartQty(p.id)
              return (
                <VariantRow
                  key={p.id}
                  accent={accent}
                  icon={Icon}
                  disabled={left <= 0}
                  onClick={() => onPick(p)}
                  title={itemLabel(p)}
                  sub={left <= 0 ? 'нет в наличии' : `остаток ${qtyFmt(left)} ${UNIT_LABELS[p.unit]}`}
                  subDanger={left <= 0}
                  right={priceOf(p)}
                />
              )
            })}
      </div>
    </Modal>
  )
}

function VariantRow({
  accent,
  icon: Icon,
  disabled,
  onClick,
  title,
  sub,
  subDanger,
  right,
}: {
  accent: string
  icon: LucideIcon
  disabled: boolean
  onClick: () => void
  title: string
  sub: string
  subDanger?: boolean
  right: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-border/50 bg-secondary/40 opacity-60'
          : 'border-border/60 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-sm'
      }`}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-medium leading-snug">{title}</span>
        <span className={`text-xs ${subDanger ? 'text-brand-bad' : 'text-muted-foreground'}`}>{sub}</span>
      </span>
      <span className="shrink-0 text-right text-[15.5px] font-medium tabular-nums">{right}</span>
      <ChevronRight
        className={`h-4 w-4 shrink-0 transition ${
          disabled
            ? 'text-transparent'
            : 'text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-primary'
        }`}
      />
    </button>
  )
}
