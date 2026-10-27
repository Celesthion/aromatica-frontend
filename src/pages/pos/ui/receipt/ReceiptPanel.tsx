import { Gift, Trash2, UserPlus, UserRound, X } from 'lucide-react'
import { Money } from '@/shared/ui'
import { UNIT_LABELS, qtyFmt } from '@/shared/lib/format'
import type { GiftRow } from '@/pages/pos/lib/rows'
import type { CartLine } from '@/pages/pos/lib/types'
import type { Overlay } from '@/pages/pos/ui/overlay'
import { PosThumb } from '@/pages/pos/ui/PosThumb'
import type { Notice } from '@/pages/pos/ui/useNotice'
import { ReceiptFooter } from './ReceiptFooter'
import { ReceiptLine } from './ReceiptLine'
import type { Receipt } from './useReceipt'

/** Правая колонка кассы: покупатель, строки чека, подарки, итог и действия. */
export function ReceiptPanel({
  receipt,
  notice,
  draftCount,
  activeReservations,
  onToShelf,
  onOpen,
}: {
  receipt: Receipt
  notice: Notice | null
  draftCount: number
  activeReservations: number
  onToShelf: (line: CartLine) => void
  onOpen: (overlay: Overlay) => void
}) {
  const { cart, customer, rows } = receipt

  return (
    <aside className="mx-4 mb-4 flex max-h-[45vh] shrink-0 flex-col overflow-hidden rounded-[24px] bg-gradient-to-b from-surface-accent-from to-surface-accent-to text-white shadow-soft backdrop-blur-xl backdrop-saturate-150 lg:m-0 lg:h-full lg:max-h-none lg:w-[clamp(470px,34vw,640px)] lg:rounded-none lg:border-l lg:border-glass-line lg:shadow-none">
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-4">
        {customer ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <UserRound className="h-4 w-4 shrink-0 text-white/60" strokeWidth={1.7} />
            <button
              type="button"
              onClick={() => onOpen({ kind: 'customers' })}
              title="Покупатель чека — открыть карточку и покупки"
              className="min-w-0 truncate text-left text-[13px] text-white/85 transition hover:text-white"
            >
              {customer.name}
              <span className="text-white/45"> · {customer.phone}</span>
            </button>
            <button
              type="button"
              title="Не связывать чек с покупателем"
              className="shrink-0 text-white/40 transition hover:text-white"
              onClick={() => receipt.setCustomer(null)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onOpen({ kind: 'customers' })}
            title="Добавить покупателя"
            className="grid h-9 w-9 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <UserPlus className="h-5 w-5" strokeWidth={1.7} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {cart.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-sm text-white/40">
            Выберите товары слева
          </p>
        ) : (
          rows.paid.map((row) => (
            <ReceiptLine
              key={row.line.lineId}
              line={row.line}
              index={row.index}
              patchLine={receipt.patchLine}
              removeLine={receipt.removeLine}
              onToShelf={onToShelf}
            />
          ))
        )}
      </div>

      {/* подарки закреплены над итогом и не уезжают при прокрутке */}
      {rows.gifts.length > 0 && (
        <div className="shrink-0 px-4">
          <div className="flex items-center gap-2 pt-1.5">
            <span className="h-px flex-1 bg-white/10" />
            <Gift className="h-3.5 w-3.5 text-brand-slate-soft" strokeWidth={1.8} />
            <span className="h-px flex-1 bg-white/10" />
          </div>
          {rows.gifts.map((row) => (
            <GiftBundleRow
              key={row.groupId}
              row={row}
              onRemove={() => receipt.removeLine(row.items[0].index)}
            />
          ))}
        </div>
      )}

      <ReceiptFooter
        receipt={receipt}
        notice={notice}
        draftCount={draftCount}
        activeReservations={activeReservations}
        onOpen={onOpen}
      />
    </aside>
  )
}

/** Набор-подарок: состав задан акцией, поэтому без правки количества, одна кнопка удаления на весь набор. */
function GiftBundleRow({ row, onRemove }: { row: GiftRow; onRemove: () => void }) {
  return (
    // pr-8: место под кнопку удаления
    <div className="group relative border-t border-white/[0.07] py-2 pr-8 first:border-t-0">
      {row.items.map(({ line: l }) => (
        <div key={l.lineId} className="flex items-center gap-2.5 py-1">
          <PosThumb kind={l.product.kind} variant="tile" imageId={l.product.mainImageId} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13.5px] font-medium leading-snug">{l.product.name}</b>
            <small className="flex items-center gap-1 text-[11.5px] text-brand-slate-soft">
              {qtyFmt(l.qty)} {UNIT_LABELS[l.product.unit]}
              <Gift className="h-3 w-3" />
            </small>
          </span>
          <span className="w-[76px] shrink-0 whitespace-nowrap text-right text-[13.5px] tabular-nums text-white/45">
            <Money minor={0} />
          </span>
        </div>
      ))}
      {/* полные названия при наведении, всплывает вверх */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-1 translate-y-[6px] rounded-xl border border-white/10 bg-brand-graphite-panel p-2 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        {row.items.map(({ line: l }) => (
          <p key={l.lineId} className="px-1 py-0.5 text-[12.5px] leading-snug text-white/75">
            {l.product.name}
            <span className="text-white/40">
              {' · '}
              {qtyFmt(l.qty)} {UNIT_LABELS[l.product.unit]}
            </span>
          </p>
        ))}
      </div>
      <button
        type="button"
        title="Убрать подарок"
        onClick={onRemove}
        className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/40 opacity-0 transition hover:bg-destructive/20 hover:text-brand-bad-soft group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
