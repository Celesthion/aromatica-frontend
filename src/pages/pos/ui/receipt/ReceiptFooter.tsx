import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Archive,
  Bookmark,
  Droplets,
  Gift,
  Pause,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { CTA_FILL, Money } from '@/shared/ui'
import type { Overlay } from '@/pages/pos/ui/overlay'
import type { Notice } from '@/pages/pos/ui/useNotice'
import { ReceiptDiscountInput } from './DiscountInputs'
import type { Receipt } from './useReceipt'

const RAIL_BUTTON =
  'relative flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white transition hover:bg-white/[0.12]'

/** Низ чека: сводка, сумма к оплате, предупреждения и кнопки действий. */
export function ReceiptFooter({
  receipt,
  notice,
  draftCount,
  activeReservations,
  onOpen,
}: {
  receipt: Receipt
  notice: Notice | null
  draftCount: number
  activeReservations: number
  onOpen: (overlay: Overlay) => void
}) {
  const { cart, totals, fromReservation, addableGifts } = receipt

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      {cart.length > 0 && (
        <div className="border-t border-white/10 pt-2 text-[12.5px]">
          <div className="flex justify-between py-0.5 text-white/55">
            <span>Позиции · {cart.length}</span>
            <Money minor={totals.subtotalMinor} />
          </div>
          {totals.lineDiscountMinor > 0 && (
            <SummaryRow label="Скидка по позициям">
              − <Money minor={totals.lineDiscountMinor} />
            </SummaryRow>
          )}
          <div className="flex items-center justify-between py-0.5 text-white/55">
            <span>Скидка на чек</span>
            <ReceiptDiscountInput
              variant="dark"
              value={receipt.receiptDiscount}
              onChange={receipt.setReceiptDiscount}
              amountMinor={totals.receiptDiscountMinor}
            />
          </div>
          {totals.receiptDiscountMinor > 0 && (
            <SummaryRow label="− по скидке чека">
              − <Money minor={totals.receiptDiscountMinor} />
            </SummaryRow>
          )}
          {totals.giftCount > 0 && (
            <SummaryRow label={<>Подарки · {totals.giftCount}</>}>по акции</SummaryRow>
          )}
        </div>
      )}

      <div className="mb-2.5 mt-1.5 flex items-baseline justify-between border-t border-white/10 pt-2.5">
        <span className="text-sm text-white/60">К оплате</span>
        <span className="text-3xl font-light tracking-tight">
          <Money minor={totals.payableMinor} />
        </span>
      </div>

      {receipt.giftOveruse.length > 0 && (
        <p className="mb-2.5 flex items-start gap-2 rounded-xl bg-brand-warn/15 px-3 py-2 text-[11.5px] text-brand-warn-soft">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Подарков больше, чем положено по акции — уберите подарок или добавьте товары.</span>
        </p>
      )}

      {notice && (
        <p
          className={`mb-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-[11.5px] ${
            notice.tone === 'warn'
              ? 'bg-brand-warn/15 text-brand-warn-soft'
              : 'bg-brand-good/15 text-brand-good-soft'
          }`}
        >
          <Droplets className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{notice.text}</span>
        </p>
      )}

      {fromReservation && (
        <p className="mb-2.5 flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2 text-[11.5px] text-white/80">
          <Bookmark className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Чек по брони: {fromReservation.name}</span>
          <button
            type="button"
            title="Не связывать чек с бронью"
            className="text-white/50 transition hover:text-white"
            onClick={receipt.unlinkReservation}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </p>
      )}

      <div className="flex gap-2.5">
        <RailButton
          icon={Gift}
          title={addableGifts > 0 ? 'Доступны подарки' : 'Подарков по чеку пока нет'}
          badge={addableGifts}
          disabled={addableGifts === 0}
          className="disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.03] disabled:text-white/25"
          onClick={() => onOpen({ kind: 'gifts' })}
        />
        <RailButton
          icon={Pause}
          title="Отложенные чеки"
          badge={draftCount}
          onClick={() => onOpen({ kind: 'drafts' })}
        />
        <RailButton
          icon={Bookmark}
          title="Брони"
          badge={activeReservations}
          onClick={() => onOpen({ kind: 'reservations' })}
        />
        <RailButton icon={Archive} title="Полка" onClick={() => onOpen({ kind: 'shelf' })} />
        <button
          type="button"
          disabled={receipt.payBlocked}
          onClick={() => onOpen({ kind: 'paying' })}
          className={`flex h-[62px] flex-1 items-center justify-center gap-2 rounded-2xl ${CTA_FILL} text-[15px] font-medium text-cta-ink shadow-[inset_0_0_0_1.5px_var(--cta-edge),inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_22px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.09] disabled:text-white/35 disabled:shadow-none`}
        >
          <Wallet className="h-[19px] w-[19px]" strokeWidth={1.7} />
          Оплатить
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between py-0.5 text-brand-slate-soft">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  )
}

function RailButton({
  icon: Icon,
  title,
  badge,
  disabled,
  className,
  onClick,
}: {
  icon: LucideIcon
  title: string
  badge?: number
  disabled?: boolean
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={className ? `${RAIL_BUTTON} ${className}` : RAIL_BUTTON}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
      {badge != null && badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-semibold text-brand-ink shadow">
          {badge}
        </span>
      )}
    </button>
  )
}
