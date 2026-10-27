import { useEffect, useReducer, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, Banknote, Coins, CreditCard, Percent } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Input, Modal } from '@/shared/ui'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { somToMinor } from '@/shared/lib/money'
import { createReceipt, type DocDto, type PosProduct, type PosShift } from '@/shared/api'
import type { ReceiptDiscount } from '@/pages/pos/lib/discount'
import { paymentTotals } from '@/pages/pos/lib/payment'
import {
  changeMinor,
  givenEnough,
  initPaymentSplit,
  paidMinor,
  paymentReducer,
} from '@/pages/pos/lib/paymentSplit'
import { buildReceiptLines, giftBaseMinor } from '@/pages/pos/lib/payload'
import type { StockShortage } from '@/pages/pos/lib/stock'
import type { CartLine } from '@/pages/pos/lib/types'
import { BackLink } from '@/pages/pos/ui/BackLink'
import { ReceiptDiscountInput } from '@/pages/pos/ui/receipt/DiscountInputs'
import { QuickPay } from '@/pages/pos/ui/QuickPay'
import { CertificateField } from './CertificateField'
import { PackagingStep } from './PackagingStep'
import { useCertificatePayment } from './useCertificatePayment'

export function PaymentModal({
  shift,
  cart,
  receiptDiscount,
  onReceiptDiscountChange,
  packaging,
  shortages,
  reservationId,
  counterpartyId,
  onClose,
  onDone,
}: {
  shift: PosShift
  cart: CartLine[]
  /** Скидку на чек можно поменять прямо здесь. */
  receiptDiscount: ReceiptDiscount
  /** Отдаёт скидку в состояние кассы, чтобы сводка и печать видели то же самое. */
  onReceiptDiscountChange: (rd: ReceiptDiscount) => void
  /** Упаковку выбирают при подтверждении чека, она добавляется в чек и к сумме. */
  packaging: PosProduct[]
  /** Чего и сколько не хватает на складе; пустой список: всё есть. */
  shortages: StockShortage[]
  /** Чек по брони; после проведения бэк пометит её проданной. */
  reservationId?: string | null
  /** Покупатель, закреплённый за чеком; null: продажа без покупателя. */
  counterpartyId?: string | null
  onClose: () => void
  onDone: (doc: DocDto, changeMinor: number) => void
}) {
  // если упаковки на складе нет, её шаг пропускаем
  const [step, setStep] = useState<'pack' | 'pay'>(packaging.length > 0 ? 'pack' : 'pay')
  // id упаковки -> количество
  const [pkgQty, setPkgQty] = useState<Record<string, number>>({})
  const certificate = useCertificatePayment()
  const { cert } = certificate

  const {
    discountMinor,
    packagingMinor: pkgTotal,
    packagingCount: pkgCount,
    grandMinor: grand,
    certificateMinor: certMinor,
    dueMinor: due,
  } = paymentTotals({
    cart,
    receiptDiscount,
    packaging,
    packagingQty: pkgQty,
    certificateBalanceMinor: cert?.payable ? cert.balanceMinor : null,
  })

  // способ оплаты по умолчанию не выбран, кассир жмёт сам
  const [split, dispatch] = useReducer(paymentReducer, initPaymentSplit(due))
  useEffect(() => {
    dispatch({ type: 'grand', grandMinor: due })
  }, [due])
  const paid = paidMinor(split)
  const change = changeMinor(split, due)
  const cashShort = !givenEnough(split, due)

  const pay = useMutation({
    mutationFn: () =>
      createReceipt(shift.id, {
        // строки и база порогов собираются так же, как в мобилке
        lines: buildReceiptLines(
          cart,
          packaging.map((p) => ({ product: p, qty: pkgQty[p.id] ?? 0 })),
          receiptDiscount,
        ),
        cashMinor: somToMinor(split.cash) ?? 0,
        noCashMinor: somToMinor(split.noCash) ?? 0,
        giftBaseMinor: giftBaseMinor(cart),
        reservationId: reservationId ?? undefined,
        counterpartyId: counterpartyId ?? undefined,
        certificateCode: certMinor > 0 ? cert!.code : undefined,
        certificateMinor: certMinor > 0 ? certMinor : undefined,
      }),
    onSuccess: (doc) => onDone(doc, change),
  })

  // количество упаковки ограничиваем остатком
  const changePkg = (p: PosProduct, delta: number) =>
    setPkgQty((prev) => ({
      ...prev,
      [p.id]: Math.max(0, Math.min((prev[p.id] ?? 0) + delta, p.qty)),
    }))

  return (
    <Modal align="center" onClose={onClose} title={step === 'pack' ? 'Упаковка' : 'Оплата'}>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-muted-foreground">К оплате</span>
        <span className="font-display text-3xl tracking-tight">{money(grand)}</span>
      </div>

      {/* продажа в минус запрещена (сервер проверяет то же): показываем, что убрать из чека */}
      {shortages.length > 0 && (
        <div className="mb-3 rounded-md border border-brand-bad/30 bg-brand-bad/10 px-3 py-2 text-sm text-brand-bad">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Не хватает на складе — уберите лишнее из чека
          </p>
          <ul className="mt-1 space-y-0.5">
            {shortages.map((s) => (
              <li key={s.product.id} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate">{s.product.name}</span>
                <span className="shrink-0 tabular-nums">
                  не хватает {qtyFmt(s.short)} {UNIT_LABELS[s.product.unit]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 'pack' ? (
        <PackagingStep
          packaging={packaging}
          packagingQty={pkgQty}
          packagingCount={pkgCount}
          packagingMinor={pkgTotal}
          onChange={changePkg}
          onContinue={() => setStep('pay')}
        />
      ) : (
        <>
          {packaging.length > 0 && (
            <BackLink onClick={() => setStep('pack')}>
              Упаковка{pkgCount > 0 ? `: ${pkgCount} шт · ${money(pkgTotal)}` : ': не выбрана'}
            </BackLink>
          )}

          {/* скидку часто договаривают уже у кассы, поэтому она правится и здесь */}
          <DiscountRow
            value={receiptDiscount}
            amountMinor={discountMinor}
            onChange={onReceiptDiscountChange}
          />

          {/* сертификат гасит сумму первым, поэтому стоит выше способов оплаты */}
          <CertificateField certificate={certificate} amountMinor={certMinor} />

          <div className="grid grid-cols-3 gap-2">
            <QuickPay
              icon={Banknote}
              label="Наличные"
              active={split.mode === 'cash'}
              onClick={() => dispatch({ type: 'mode', mode: 'cash', grandMinor: due })}
            />
            <QuickPay
              icon={CreditCard}
              label="Безналичные"
              active={split.mode === 'noCash'}
              onClick={() => dispatch({ type: 'mode', mode: 'noCash', grandMinor: due })}
            />
            <QuickPay
              icon={Coins}
              label="Смешанная"
              active={split.mode === 'mixed'}
              onClick={() => dispatch({ type: 'mode', mode: 'mixed', grandMinor: due })}
            />
          </div>

          {/* по умолчанию внесено ровно по чеку; в чек уходит сумма чека, а не внесённое */}
          {split.mode === 'cash' && (
            <div className="mx-auto mt-4 max-w-sm space-y-3">
              <PayInput
                label="Внесено"
                value={split.given}
                onChange={(v) => dispatch({ type: 'editGiven', value: v })}
              />
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Сдача</span>
                <span className={`font-semibold tabular-nums ${change > 0 ? '' : 'text-muted-foreground'}`}>
                  {money(change)}
                </span>
              </div>
            </div>
          )}

          {/* при смешанной оплате второе поле дополняется само */}
          {split.mode === 'mixed' && (
            <div className="mx-auto mt-4 max-w-sm space-y-3">
              <PayInput
                label="Наличными"
                value={split.cash}
                onChange={(v) => dispatch({ type: 'editCash', value: v, grandMinor: due })}
              />
              <PayInput
                label="Безналичными"
                value={split.noCash}
                onChange={(v) => dispatch({ type: 'editNoCash', value: v, grandMinor: due })}
              />
            </div>
          )}

          {due === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Сертификат покрывает чек целиком — доплаты нет
            </p>
          ) : split.mode === null ? (
            <p className="mt-3 text-sm text-muted-foreground">Выберите способ оплаты</p>
          ) : cashShort ? (
            <p className="mt-3 text-sm text-brand-bad">
              Внесено меньше суммы к доплате {money(due)} — сдачу не посчитать
            </p>
          ) : (
            paid !== due && (
              <p className="mt-3 text-sm text-brand-bad">
                Оплата {money(paid)} не сходится с суммой к доплате {money(due)}
              </p>
            )
          )}
          <ErrorNote error={pay.error} className="mt-3" />

          <Button
            className="mt-5 h-12 w-full text-base"
            disabled={
              shortages.length > 0 ||
              (due > 0 && (split.mode === null || paid !== due || cashShort)) ||
              pay.isPending
            }
            onClick={() => pay.mutate()}
          >
            {pay.isPending ? <ButtonSpinner size="lg" /> : 'Пробить чек'}
          </Button>
        </>
      )}
    </Modal>
  )
}

/** Повторное нажатие активного процента снимает скидку, как и в сводке чека. */
function DiscountRow({
  value,
  amountMinor,
  onChange,
}: {
  value: ReceiptDiscount
  amountMinor: number
  onChange: (rd: ReceiptDiscount) => void
}) {
  return (
    <div className="mb-3 rounded-xl border border-border/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
        <span className="text-sm text-muted-foreground">Скидка на чек</span>
        <span className="ml-auto">
          <ReceiptDiscountInput variant="light" value={value} onChange={onChange} amountMinor={amountMinor} />
        </span>
      </div>
      {amountMinor > 0 && (
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Скидка</span>
          <span>− {money(amountMinor)}</span>
        </div>
      )}
    </div>
  )
}

function PayInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        className="h-10 w-32 text-right"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
      />
    </label>
  )
}
