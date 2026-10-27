import { MoreVertical } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { imageUrl, type AdminProduct, type StockLevel, type StockRow } from '@/shared/api'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'

/** Стиль и подпись по уровню остатка; порог считает сервер. */
function stockStatus(level: StockLevel) {
  if (level === 'OUT')
    return { label: 'Нет в наличии', cls: 'text-destructive bg-destructive/10', bar: 'bg-brand-bad' }
  if (level === 'LOW')
    return {
      label: 'Заканчивается',
      cls: 'text-brand-warn bg-brand-warn/12',
      bar: 'bg-gradient-to-r from-tint-gold to-brand-warn',
    }
  return {
    label: 'В наличии',
    cls: 'text-brand-good bg-brand-good/12',
    bar: 'bg-gradient-to-r from-brand-slate-soft to-brand-ink',
  }
}

/** Превью в строке товара: фото или нарисованный флакон. */
function BottleThumb({ imageId }: { imageId?: string | null }) {
  if (imageId) {
    return (
      <img
        src={imageUrl(imageId)}
        alt=""
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
      />
    )
  }
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-tint-bottle to-tint-bottle-deep">
      <span className="absolute left-1/2 top-[7px] h-1.5 w-1.5 -translate-x-1/2 rounded-[2px] bg-brand-slate-deep" />
      <span className="absolute left-1/2 top-2.5 h-[18px] w-2.5 -translate-x-1/2 rounded-[3px] bg-gradient-to-b from-tint-slate to-brand-slate" />
    </span>
  )
}

/** Строка каталога; при открытом фаст-вью остаются только товар и цена. */
export function ProductRow({
  product: p,
  stock: st,
  selected,
  compact,
  kindLabel,
  onOpen,
}: {
  product: AdminProduct
  stock: StockRow | undefined
  selected: boolean
  compact: boolean
  kindLabel: (kind: string) => string
  onOpen: () => void
}) {
  const qty = st?.qty ?? 0
  const unit = st?.unit ?? p.unit
  const status = stockStatus(st?.level ?? 'OUT')
  const full = unit === 'ML' ? 100 : 20
  const width = qty > 0 ? Math.min(100, Math.max(6, (qty / full) * 100)) : 4
  return (
    <tr
      onClick={onOpen}
      className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
        selected ? 'bg-muted/60' : 'hover:bg-muted/40'
      } ${p.archived ? 'opacity-50' : ''}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <BottleThumb imageId={p.mainImageId} />
          <div className="min-w-0">
            <b className="block truncate font-medium">{p.name}</b>
            <small className="text-xs text-muted-foreground">
              {kindLabel(p.kind)} · {UNIT_LABELS[p.unit]}
              {p.volumeMl != null ? ` · ${p.volumeMl} мл` : ''}
              {p.article ? ` · ${p.article}` : ''}
            </small>
          </div>
          {p.archived && (
            <Badge variant="outline" className="ml-1 shrink-0">
              архив
            </Badge>
          )}
        </div>
      </td>
      {!compact && (
        <td className="px-4 py-3" data-label="Категория">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {kindLabel(p.kind)}
          </span>
        </td>
      )}
      {!compact && (
        <td className="px-4 py-3" data-label="Остаток">
          <div className="w-28">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <span className={`block h-full rounded-full ${status.bar}`} style={{ width: `${width}%` }} />
            </div>
            <small className="mt-1 block text-xs text-muted-foreground/80">
              {st ? `${qtyFmt(qty)} ${UNIT_LABELS[unit]}` : '—'}
            </small>
          </div>
        </td>
      )}
      <td className="px-4 py-3 text-right tabular-nums" data-label="Цена">
        {p.priceKopecks != null ? money(p.priceKopecks) : '—'}
      </td>
      {!compact && (
        <td className="px-4 py-3" data-label="Статус">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${status.cls}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </td>
      )}
      {!compact && (
        <td className="w-10 px-2 py-3 text-right">
          <button
            type="button"
            title="Открыть"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  )
}
