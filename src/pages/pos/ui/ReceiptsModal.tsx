import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, Banknote, CreditCard, Eye } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Input, Modal, Spinner } from '@/shared/ui'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import { parseDecimal } from '@/shared/lib/money'
import { createPosReturn, voidPosReceipt, type DocDto, type PosShift, queryKeys } from '@/shared/api'
import { pricePerSprayMl, sprayForOil } from '@/entities/product/dilution'
import { isCustomerLine } from '@/entities/shift/receiptLines'
import { receiptLinesSummary, useShiftReceipts } from '@/entities/shift/shiftSummary'
import { returnItems, returnShareMinor, returnSumMinor, type ReturnItem } from '@/pages/pos/lib/returns'
import type { PayMethod } from '@/pages/pos/lib/types'
import { QuickPay } from './QuickPay'

export function ReceiptsModal({
  shift,
  login,
  userName,
  onClose,
  onReturned,
}: {
  shift: PosShift
  login: string
  userName: string
  onClose: () => void
  onReturned: (doc: DocDto) => void
}) {
  const queryClient = useQueryClient()
  const receipts = useShiftReceipts(shift.id)
  const [returning, setReturning] = useState<DocDto | null>(null)
  const [viewing, setViewing] = useState<DocDto | null>(null)
  const [voiding, setVoiding] = useState<DocDto | null>(null)

  const doVoid = useMutation({
    mutationFn: (doc: DocDto) => voidPosReceipt(shift.id, doc.id),
    onSuccess: () => {
      setVoiding(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  if (returning) {
    return (
      <ReturnModal shift={shift} receipt={returning} onClose={() => setReturning(null)} onDone={onReturned} />
    )
  }

  if (viewing) {
    return <ReceiptViewModal receipt={viewing} onClose={() => setViewing(null)} />
  }

  return (
    <Modal align="center" onClose={onClose} title={`Чеки смены №${shift.number}`} maxWidth="max-w-lg">
      {!receipts.data ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : receipts.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Чеков ещё нет</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          {receipts.data.map((d) => (
            <div key={d.id} className="border-b border-border/40 py-2.5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {d.docType === 'RETURN' ? 'Возврат' : 'Чек'} №{d.number}
                </span>
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {dateTimeFmt(d.moment)}
                  {d.createdBy ? ` · ${d.createdBy}` : ''}
                </span>
                <span className="ml-auto shrink-0 font-semibold">{money(d.sumMinor)}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{receiptLinesSummary(d)}</p>
              <div className="mt-1.5 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewing(d)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Открыть
                </Button>
                {/* принесённое обратно ложится на полку, а не на склад */}
                {d.docType === 'SALE' && (
                  <Button variant="outline" size="sm" onClick={() => setReturning(d)}>
                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                    На полку
                  </Button>
                )}
                {/* createdBy: отображаемое имя, поэтому сверяем и с именем, и с логином */}
                {(d.createdBy === userName || d.createdBy === login) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand-bad hover:text-brand-bad"
                    onClick={() => setVoiding(d)}
                  >
                    Сторно
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {voiding && (
        <div className="mt-3 rounded-xl border border-brand-bad/30 bg-brand-bad/10 p-3 text-sm">
          <p>
            Отменить {voiding.docType === 'RETURN' ? 'возврат' : 'чек'} №{voiding.number} на{' '}
            <b>{money(voiding.sumMinor)}</b>? Товар и деньги вернутся в состояние «до чека».
          </p>
          <ErrorNote error={doVoid.error} className="mt-3" />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={doVoid.isPending}
              onClick={() => doVoid.mutate(voiding)}
            >
              {doVoid.isPending ? <ButtonSpinner /> : 'Да, сторно'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVoiding(null)}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ReceiptViewModal({ receipt, onClose }: { receipt: DocDto; onClose: () => void }) {
  const isReturn = receipt.docType === 'RETURN'
  const payments = (
    [
      ['Наличными', receipt.cashMinor],
      ['Переводом', receipt.noCashMinor],
    ] as const
  ).filter(([, v]) => v > 0)

  return (
    <Modal
      align="center"
      maxWidth="max-w-lg"
      onClose={onClose}
      title={`${isReturn ? 'Возврат' : 'Чек'} №${receipt.number}`}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {dateTimeFmt(receipt.moment)}
        {receipt.createdBy ? ` · продавец: ${receipt.createdBy}` : ''}
      </p>

      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border/60">
        {receipt.lines.filter(isCustomerLine).map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 border-b border-border/40 px-3 py-2.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{l.productName}</p>
              <p className="text-xs text-muted-foreground">
                {l.dilutionPct != null
                  ? `${qtyFmt(sprayForOil(l.qty, l.dilutionPct))} мл · ${qtyFmt(l.dilutionPct)} % × ${money(pricePerSprayMl(l.priceMinor, l.dilutionPct))}`
                  : `${qtyFmt(l.qty)} × ${money(l.priceMinor)}`}
                {l.discountMinor > 0 ? ` · скидка ${money(l.discountMinor)}` : ''}
                {l.gift ? ' · 🎁 подарок' : ''}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">{money(l.sumMinor)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-secondary/60 p-3 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Итого</span>
          <span className="font-display text-xl tracking-tight">{money(receipt.sumMinor)}</span>
        </div>
        {payments.map(([label, v]) => (
          <div key={label} className="flex items-center justify-between text-muted-foreground">
            <span>{isReturn ? `Возвращено: ${label.toLowerCase()}` : label}</span>
            <span className="tabular-nums">{money(v)}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full justify-center" onClick={onClose}>
        ← Назад к чекам
      </Button>
    </Modal>
  )
}

/** Возврат покупки: деньги клиенту, товар на полку; штучное любым количеством, флакон только целиком. */
function ReturnModal({
  shift,
  receipt,
  onClose,
  onDone,
}: {
  shift: PosShift
  receipt: DocDto
  onClose: () => void
  onDone: (doc: DocDto) => void
}) {
  const items = returnItems(receipt.lines)
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((it) => [it.key, it.qty])),
  )
  const [method, setMethod] = useState<PayMethod>('cash')

  const picked = items.map((it) => ({ item: it, qty: qtys[it.key] ?? 0 })).filter((x) => x.qty > 0)
  const total = picked.reduce((s, x) => s + returnSumMinor(x.item, x.qty), 0)
  const toggle = (it: ReturnItem) =>
    setQtys((prev) => ({ ...prev, [it.key]: (prev[it.key] ?? 0) > 0 ? 0 : it.qty }))

  const doReturn = useMutation({
    mutationFn: () =>
      createPosReturn(shift.id, {
        sourceReceiptId: receipt.id,
        // флакон уходит всеми строками (воду сервер добирает сам), штучное выбранным количеством
        lines: picked.flatMap((x) =>
          x.item.lines.map((l) => ({
            productId: l.productId,
            qty: x.item.whole ? l.qty : x.qty,
            priceMinor: l.priceMinor,
            discountMinor: x.item.whole ? l.discountMinor : returnShareMinor(l, x.qty),
            // подарок возвращается подарком: бесплатно и только на полку
            gift: l.gift || undefined,
            // метка нужна, чтобы различать два одинаковых флакона в чеке
            bundleId: l.bundleId ?? undefined,
          })),
        ),
        cashMinor: method === 'cash' ? total : 0,
        noCashMinor: method === 'noCash' ? total : 0,
        comment: `На полку по чеку №${receipt.number}`,
      }),
    onSuccess: onDone,
  })

  return (
    <Modal align="center" onClose={onClose} title={`На полку по чеку №${receipt.number}`}>
      <div className="max-h-[40vh] space-y-2 overflow-y-auto">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            {it.whole ? (
              <>
                {it.hint && <span className="shrink-0 text-xs text-muted-foreground">{it.hint}</span>}
                <Button
                  type="button"
                  variant={(qtys[it.key] ?? 0) > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggle(it)}
                >
                  {(qtys[it.key] ?? 0) > 0 ? 'на полку' : 'не возвращаем'}
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">из {qtyFmt(it.qty)}</span>
                <Input
                  className="h-9 w-20 text-right"
                  inputMode="decimal"
                  value={qtys[it.key] ?? 0}
                  onChange={(e) => {
                    const n = parseDecimal(e.target.value)
                    setQtys((prev) => ({
                      ...prev,
                      [it.key]: Number.isFinite(n) ? Math.min(Math.max(n, 0), it.qty) : 0,
                    }))
                  }}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <QuickPay
          icon={Banknote}
          label="Наличные"
          active={method === 'cash'}
          onClick={() => setMethod('cash')}
        />
        <QuickPay
          icon={CreditCard}
          label="Безнал"
          active={method === 'noCash'}
          onClick={() => setMethod('noCash')}
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-muted-foreground">Вернуть покупателю деньгами</span>
        <span className="font-display text-2xl tracking-tight">{money(total)}</span>
      </div>
      <ErrorNote error={doReturn.error} className="mt-3" />
      <Button
        className="mt-4 h-12 w-full"
        disabled={total <= 0 || doReturn.isPending}
        onClick={() => doReturn.mutate()}
      >
        {doReturn.isPending ? <ButtonSpinner size="lg" /> : 'Положить на полку'}
      </Button>
    </Modal>
  )
}
