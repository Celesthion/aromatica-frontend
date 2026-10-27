import { Button } from '@/shared/ui'
import { money, qtyFmt } from '@/shared/lib/format'
import { MIN_DILUTION_PCT } from '@/entities/product/dilution'
import { CardCheck } from '@/pages/pos/ui/CardCheck'
import { CARD_BASE, CARD_OFF, CARD_ON } from '@/pages/pos/ui/cardStyles'
import type { PourForm } from './usePourForm'

/** Первый шаг налива: доля масла (у разлива) и объём флакона. */
export function PourVolumeStep({ form, initialMl }: { form: PourForm; initialMl?: number }) {
  const { pct, perSprayMl, sprayAvailable, usingCustom, customValid, customN } = form
  return (
    <>
      {/* доля масла первой: от неё зависят цена флакона и объём, на который хватит масла */}
      {form.dilutable && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Доля масла</span>
          <span
            className={`flex h-9 items-center gap-1 rounded-full border px-3 ${
              form.pctBroken ? 'border-brand-bad/60' : 'border-border/60'
            }`}
          >
            <input
              inputMode="decimal"
              value={form.pctText}
              onChange={(e) => form.typePct(e.target.value)}
              onBlur={form.commitPct}
              className="w-10 bg-transparent text-center text-sm font-medium outline-none"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {form.pctBroken
              ? `От ${MIN_DILUTION_PCT} до 100 %`
              : pct === 100
                ? 'Чистое масло без разбавления'
                : 'Остальное — парфюмерная вода'}
          </span>
        </div>
      )}
      <p className="mb-2 text-sm text-muted-foreground">
        {initialMl != null ? `Осталось долить ${qtyFmt(initialMl)} мл по прошлому наливу` : 'Выберите объём'}
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 p-1">
        {form.volumes.map((ml) => {
          const on = !usingCustom && form.presetMl === ml
          const tooMuch = ml > sprayAvailable
          return (
            <button
              key={ml}
              type="button"
              disabled={tooMuch}
              onClick={() => form.pickPreset(ml)}
              className={`${CARD_BASE} w-[96px] ${
                tooMuch ? 'cursor-not-allowed border-border/50 opacity-40' : on ? CARD_ON : CARD_OFF
              }`}
            >
              {on && <CardCheck />}
              <span className="block font-display text-2xl leading-none tracking-tight">{ml}</span>
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">мл</span>
              <span className="mt-1 block text-[12.5px] font-semibold tracking-tight">
                {money(ml * perSprayMl)}
              </span>
            </button>
          )
        })}
        {/* для клиента со своей тарой объём вводят вручную */}
        <div className={`${CARD_BASE} w-[112px] ${usingCustom ? CARD_ON : 'border-dashed border-border/70'}`}>
          {usingCustom && customValid && <CardCheck />}
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Свой объём</span>
          <input
            inputMode="decimal"
            value={form.customMl}
            onChange={(e) => form.typeCustom(e.target.value)}
            placeholder="мл"
            className="w-full bg-transparent text-center font-display text-2xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <span className="block text-[12.5px] font-semibold tracking-tight text-muted-foreground">
            {customValid ? money(Math.round(customN * perSprayMl)) : `${money(perSprayMl)}/мл`}
          </span>
        </div>
      </div>
      {usingCustom && !customValid && (
        <p className="mt-2 text-center text-xs text-brand-bad">
          Объём должен быть больше 0 и не больше остатка ({qtyFmt(sprayAvailable)} мл)
        </p>
      )}
      {/* пресет переводит дальше сам, для своего объёма нужна кнопка */}
      {usingCustom && customValid && (
        <Button className="mt-5 h-12 w-full text-base" onClick={() => form.setStage('atomizer')}>
          Далее · {qtyFmt(customN)} мл · {money(Math.round(customN * perSprayMl))}
        </Button>
      )}
    </>
  )
}
