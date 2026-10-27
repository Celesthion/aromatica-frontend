import { Button, ButtonSpinner, ErrorNote } from '@/shared/ui'
import { money, qtyFmt } from '@/shared/lib/format'
import { BackLink } from '@/pages/pos/ui/BackLink'
import { CardCheck } from '@/pages/pos/ui/CardCheck'
import { CARD_BASE, CARD_OFF, CARD_ON } from '@/pages/pos/ui/cardStyles'
import type { PourForm } from './usePourForm'

/** Флакон кончился раньше учёта: кассир вводит налитое, нехватку и списание касса считает сама. */
export function PourShortfallStep({ form, available }: { form: PourForm; available: number }) {
  const { pouredMl, pouredOk, short, writingOff } = form
  return (
    <>
      <BackLink onClick={form.closeShortfall}>назад к наливу</BackLink>
      <p className="mb-2 text-sm text-muted-foreground">Сколько реально вышло из флакона?</p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 p-1">
        <div className={`${CARD_BASE} w-[128px] ${pouredOk ? CARD_ON : 'border-dashed border-border/70'}`}>
          {pouredOk && <CardCheck />}
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Налито</span>
          <input
            autoFocus
            inputMode="decimal"
            value={pouredMl}
            onChange={(e) => form.setPouredMl(e.target.value)}
            placeholder="мл"
            className="w-full bg-transparent text-center font-display text-2xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <span className="block text-[12.5px] font-semibold tracking-tight text-muted-foreground">мл</span>
        </div>
        <button
          type="button"
          onClick={() => form.setPouredMl('0')}
          className={`${CARD_BASE} w-[128px] ${CARD_OFF} border-dashed`}
        >
          <span className="block text-[12.5px] font-medium leading-snug">Ничего не вышло</span>
          <span className="mt-1 block text-[11px] text-muted-foreground">флакон был пуст</span>
        </button>
      </div>

      {pouredMl.trim() !== '' && !pouredOk && (
        <p className="mt-2 text-center text-xs text-brand-bad">
          Введите от 0 до остатка ({qtyFmt(available)} мл): больше остатка — это уже не нехватка.
        </p>
      )}

      {short && (
        <div className="mt-4 space-y-1.5 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm">
          {short.shortfallMl > 0 && (
            <p className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Долить клиенту</span>
              <span className="font-semibold tabular-nums">{qtyFmt(short.shortfallMl)} мл</span>
            </p>
          )}
          {short.writeOffMl > 0 ? (
            <p className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Спишется как потери</span>
              <span className="font-semibold tabular-nums">
                {qtyFmt(short.writeOffMl)} мл · {money(Math.round(short.writeOffMl * form.perMl))}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Списывать нечего: остаток сходится с налитым.</p>
          )}
        </div>
      )}

      <ErrorNote error={form.writeOffError} className="mt-3" />

      <Button
        disabled={short == null || short.writeOffMl <= 0 || writingOff}
        onClick={form.confirmShortfall}
        className="mt-4 h-12 w-full text-base"
      >
        {writingOff ? (
          <ButtonSpinner />
        ) : short && short.writeOffMl > 0 ? (
          `Списать ${qtyFmt(short.writeOffMl)} мл`
        ) : (
          'Списать хвост'
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Причина — флакон кончился. Операция попадёт в смену и в ленту действий.
      </p>
    </>
  )
}
