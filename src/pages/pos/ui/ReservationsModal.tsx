import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, BookmarkPlus, UserRound } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Input, Modal, Spinner } from '@/shared/ui'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import {
  cancelReservation,
  createReservation,
  extendReservation,
  fetchReservations,
  type PosCustomer,
  type PosSettings,
  type PosShift,
  type Reservation,
  queryKeys,
} from '@/shared/api'
import {
  daysLeft,
  normalizeReservationDays,
  reservationLines,
  reservationSumMinor,
} from '@/pages/pos/lib/reservations'
import type { CartLine } from '@/pages/pos/lib/types'
import type { ReceiptDiscount } from '@/pages/pos/lib/discount'

/** Брони: оформить текущий чек на покупателя (до срока товар не в доступном остатке) и список активных. */
export function ReservationsModal({
  shift,
  cart,
  customer,
  openForm,
  onPickCustomer,
  receiptDiscount,
  settings,
  selling,
  sellError,
  onReserved,
  onSell,
  onClose,
}: {
  shift: PosShift
  cart: CartLine[]
  /** Бронь оформляется только на покупателя чека. */
  customer: PosCustomer | null
  /** Сразу открыть форму новой брони. */
  openForm?: boolean
  onPickCustomer: () => void
  /** Скидка на чек тоже фиксируется в цене брони. */
  receiptDiscount: ReceiptDiscount
  settings: PosSettings | null
  /** Пока продажа идёт (собранный чек откладывается), кнопки заблокированы. */
  selling: boolean
  sellError: unknown
  onReserved: () => void
  /** Строки брони уходят в чек. */
  onSell: (r: Reservation) => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const list = useQuery({
    queryKey: queryKeys.pos.reservations.byWarehouse(shift.warehouseId),
    queryFn: () => fetchReservations(shift.warehouseId),
  })

  // бронируем только платные строки по цене со скидками
  const resLines = reservationLines(cart, receiptDiscount)
  const hasGifts = cart.some((l) => l.isGift)
  const defaultDays = settings?.reservationDefaultDays ?? 3
  const maxDays = settings?.reservationMaxDays ?? 14

  const [form, setForm] = useState<{ days: string; comment: string } | null>(
    openForm && customer ? { days: String(defaultDays), comment: '' } : null,
  )
  const create = useMutation({
    mutationFn: () =>
      createReservation({
        warehouseId: shift.warehouseId,
        counterpartyId: customer!.id,
        comment: form!.comment.trim() || null,
        // тот же кламп, что в подписи кнопки, чтобы показанное совпало с отправленным
        days: normalizeReservationDays(form!.days, defaultDays, maxDays),
        lines: resLines,
      }),
    onSuccess: () => {
      setForm(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
      onReserved()
    },
  })

  const cancel = useMutation({
    mutationFn: (r: Reservation) => cancelReservation(r.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  })
  const extend = useMutation({
    mutationFn: (r: Reservation) => extendReservation(r.id, defaultDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  })
  const [cancelling, setCancelling] = useState<Reservation | null>(null)

  const formDays = form ? normalizeReservationDays(form.days, defaultDays, maxDays) : defaultDays

  return (
    <Modal align="center" maxWidth="max-w-lg" onClose={onClose} title="Брони">
      {form == null ? (
        resLines.length > 0 && (
          <Button
            variant="outline"
            className="mb-3 w-full justify-center"
            // без покупателя в чеке бронь не оформить, сначала выбираем его
            onClick={() =>
              customer ? setForm({ days: String(defaultDays), comment: '' }) : onPickCustomer()
            }
          >
            <BookmarkPlus className="mr-1.5 h-4 w-4" />
            Забронировать текущий чек · {money(reservationSumMinor(resLines))}
          </Button>
        )
      ) : (
        <form
          className="mb-4 space-y-3 rounded-xl border border-border/60 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (customer) create.mutate()
          }}
        >
          {/* покупатель берётся из чека, сменить его можно там же */}
          <div className="flex items-center gap-2 rounded-xl border border-glass-line bg-glass px-3 py-2 text-sm">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            <span className="min-w-0 flex-1 truncate">
              {customer?.name}
              {customer?.phone ? <span className="text-muted-foreground"> · {customer.phone}</span> : null}
            </span>
            <button
              type="button"
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={onPickCustomer}
            >
              Сменить
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Срок, дней</span>
            <Input
              className="h-9 w-16 text-center"
              inputMode="numeric"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">не больше {maxDays}</span>
          </div>
          <Input
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          {hasGifts && (
            <p className="flex items-start gap-1.5 text-xs text-brand-warn">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Подарки в бронь не попадают — акция действует на момент чека.
            </p>
          )}
          <ErrorNote error={create.error} />
          <div className="flex gap-2">
            <Button type="submit" disabled={!customer || create.isPending} className="flex-1">
              {create.isPending ? <ButtonSpinner /> : `Забронировать на ${formDays} дн.`}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Отмена
            </Button>
          </div>
        </form>
      )}

      {!list.data ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : list.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Активных броней нет</p>
      ) : (
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {list.data.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border px-3 py-2.5 ${r.expired ? 'border-brand-warn/30 bg-brand-warn/10' : 'border-border/60'}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {r.customerName}
                  {r.phone ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">{r.phone}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-semibold">{money(r.sumMinor)}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {r.lines.map((l) => `${l.productName} ×${qtyFmt(l.qty)}`).join(', ')}
              </p>
              <p
                className={`mt-0.5 text-xs ${r.expired ? 'font-medium text-brand-warn' : 'text-muted-foreground'}`}
              >
                {r.expired
                  ? 'Просрочена — товар уже не держится'
                  : `До ${dateTimeFmt(r.expiresAt)} · осталось ${daysLeft(r.expiresAt, new Date())} дн.`}
                {r.comment ? ` · ${r.comment}` : ''}
              </p>
              <div className="mt-1.5 flex gap-2">
                <Button
                  size="sm"
                  disabled={selling || r.expired}
                  title={r.expired ? 'Бронь просрочена — продлите её перед продажей' : undefined}
                  onClick={() => onSell(r)}
                >
                  Продать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={extend.isPending}
                  onClick={() => extend.mutate(r)}
                >
                  Продлить +{defaultDays} дн.
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-brand-bad hover:text-brand-bad"
                  onClick={() => setCancelling(r)}
                >
                  Отменить
                </Button>
              </div>
              {cancelling?.id === r.id && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-bad/30 bg-brand-bad/10 px-2.5 py-1.5 text-xs text-brand-bad">
                  <span className="flex-1">Отменить бронь? Товар вернётся в доступный остаток.</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(r)}
                  >
                    {cancel.isPending ? <ButtonSpinner size="sm" /> : 'Да'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCancelling(null)}>
                    Нет
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ErrorNote error={cancel.error ?? extend.error ?? sellError} className="mt-3" />
    </Modal>
  )
}
