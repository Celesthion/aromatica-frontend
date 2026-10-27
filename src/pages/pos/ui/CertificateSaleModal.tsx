import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Banknote, CreditCard, Ticket, UserRound } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Input, Modal } from '@/shared/ui'
import { money } from '@/shared/lib/format'
import {
  checkGiftCertificate,
  sellGiftCertificate,
  type GiftCheck,
  type PosCustomer,
  type PosShift,
  queryKeys,
} from '@/shared/api'
import type { PayMethod } from '@/pages/pos/lib/types'
import { CustomerModal } from './CustomerModal'
import { QuickPay } from './QuickPay'

/**
 * Продажа подарочного сертификата на кассе.
 *
 * Это не чек: товар не отгружается, выручки нет. Деньги приходят как аванс,
 * выручка появится, когда сертификатом расплатятся.
 * Номинал напечатан на бланке, кассир только сканирует код и выбирает способ оплаты.
 */
export function CertificateSaleModal({
  shift,
  onClose,
  onSold,
}: {
  shift: PosShift
  onClose: () => void
  onSold: (code: string, nominalMinor: number) => void
}) {
  const [code, setCode] = useState('')
  const [found, setFound] = useState<GiftCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<PayMethod>('cash')
  // покупатель обязателен: без него при потере бланка нечем подтвердить покупку.
  // Это тот, кто купил, а не будущий владелец, сертификаты обычно дарят.
  const [buyer, setBuyer] = useState<PosCustomer | null>(null)
  const [picking, setPicking] = useState(false)
  const queryClient = useQueryClient()

  const check = async () => {
    setChecking(true)
    setError(null)
    try {
      const c = await checkGiftCertificate(code.trim())
      if (c.status == null) {
        setError('Такого бланка нет — проверьте код или заведите пачку в админке')
        setFound(null)
        return
      }
      // продать можно только непроданный бланк
      if (c.status !== 'NEW') {
        setError(c.status === 'BLOCKED' ? 'Бланк заблокирован' : 'Этот сертификат уже продан')
        setFound(null)
        return
      }
      setFound(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить бланк')
    } finally {
      setChecking(false)
    }
  }

  const sell = useMutation({
    mutationFn: () =>
      sellGiftCertificate(shift.id, {
        code: found!.code,
        cashMinor: method === 'cash' ? found!.nominalMinor : 0,
        noCashMinor: method === 'noCash' ? found!.nominalMinor : 0,
        customerId: buyer!.id,
      }),
    onSuccess: () => {
      // в сводке смены выросли деньги в ящике, но не выручка
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
      onSold(found!.code, found!.nominalMinor)
    },
  })

  // поиск покупателя открываем вместо окна продажи, стопка модалок у прилавка путает.
  // Введённый код при этом сохраняется.
  if (picking) {
    return (
      <CustomerModal
        attached={buyer}
        pickLabel="Выбрать"
        pickedLabel="Выбран"
        onPick={(c) => {
          setBuyer(c)
          setPicking(false)
        }}
        onClose={() => setPicking(false)}
      />
    )
  }

  return (
    <Modal onClose={onClose} title="Продать сертификат" maxWidth="max-w-md">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
        <Input
          className="h-11 flex-1"
          value={code}
          autoFocus
          placeholder="Код с бланка"
          onChange={(e) => {
            setCode(e.target.value)
            setFound(null)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !found) void check()
          }}
        />
        {!found && (
          <Button
            variant="outline"
            className="h-11"
            disabled={!code.trim() || checking}
            onClick={() => void check()}
          >
            {checking ? <ButtonSpinner /> : 'Проверить'}
          </Button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {found && (
        <>
          <div className="mt-4 flex items-baseline justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">Номинал бланка</span>
            <span className="font-display text-2xl tracking-tight">{money(found.nominalMinor)}</span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">Кому продаём</p>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className={`mt-1.5 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              buyer ? 'border-border/60' : 'border-dashed border-border hover:border-primary/50'
            }`}
          >
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            {buyer ? (
              <span className="min-w-0 flex-1 truncate">
                {buyer.name}
                <span className="text-muted-foreground"> · {buyer.phone}</span>
              </span>
            ) : (
              <span className="flex-1 text-muted-foreground">Выбрать покупателя</span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              {buyer ? 'изменить' : 'обязательно'}
            </span>
          </button>

          <p className="mt-3 text-sm text-muted-foreground">Чем заплатили</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <QuickPay
              icon={Banknote}
              label="Наличные"
              active={method === 'cash'}
              onClick={() => setMethod('cash')}
            />
            <QuickPay
              icon={CreditCard}
              label="Безналичные"
              active={method === 'noCash'}
              onClick={() => setMethod('noCash')}
            />
          </div>

          <ErrorNote error={sell.error} className="mt-3" />

          <Button
            className="mt-4 h-12 w-full text-base"
            disabled={sell.isPending || buyer == null}
            onClick={() => sell.mutate()}
          >
            {sell.isPending ? <ButtonSpinner size="lg" /> : 'Продать сертификат'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Деньги лягут в кассу, но в выручку смены не попадут — это аванс
          </p>
        </>
      )}
    </Modal>
  )
}
