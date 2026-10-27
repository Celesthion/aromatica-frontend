import { Button } from '@/shared/ui'
import { money, qtyFmt } from '@/shared/lib/format'
import type { PosProduct } from '@/shared/api'
import { groupProducts } from '@/pages/pos/lib/grouping'
import { BackLink } from '@/pages/pos/ui/BackLink'
import { CardCheck } from '@/pages/pos/ui/CardCheck'
import { CARD_BASE, CARD_OFF, CARD_ON } from '@/pages/pos/ui/cardStyles'
import type { PourForm } from './usePourForm'

// на карточке только то, что отличает атомайзеры; в чек уйдёт полное имя
const atomizerLabel = (a: PosProduct) => (a.model ? (a.label ? `${a.model} · ${a.label}` : a.model) : a.name)

/** Второй шаг налива: атомайзер выбранного объёма; цвета раскрываются по нажатию на карточку. */
export function PourAtomizerStep({
  form,
  inCartQty,
  onPick,
}: {
  form: PourForm
  inCartQty: (id: string) => number
  onPick: (qty: number, unitPriceMinor: number, atomizer: PosProduct | null, dilutionPct?: number) => void
}) {
  const { activeMl, atomizerId, atomizerGroup, perSprayMl, selectedAtomizer } = form
  return (
    <>
      {atomizerGroup == null ? (
        <>
          <BackLink onClick={() => form.setStage('ml')}>
            {activeMl != null && `${qtyFmt(activeMl)} мл · ${money(Math.round(activeMl * perSprayMl))}`}
            <span className="text-muted-foreground/60">· к объёмам</span>
          </BackLink>
          <div className="flex max-h-[48vh] flex-wrap justify-center gap-2.5 overflow-y-auto p-1">
            {groupProducts(form.atomizersForMl).map((g) => {
              const single = g.variants.length === 1
              const first = g.variants[0]
              const selectedHere = g.variants.find((v) => v.id === atomizerId)
              const left = g.variants.reduce((s, v) => s + (v.qty - inCartQty(v.id)), 0)
              const minPrice = Math.min(...g.variants.map((v) => v.priceMinor ?? 0))
              const samePrice = g.variants.every((v) => (v.priceMinor ?? 0) === minPrice)
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => (single ? form.setAtomizerId(first.id) : form.setAtomizerGroup(g))}
                  className={`${CARD_BASE} w-[128px] ${selectedHere ? CARD_ON : CARD_OFF}`}
                >
                  {selectedHere && <CardCheck />}
                  <span className="line-clamp-2 text-[12.5px] font-medium leading-snug">{g.model}</span>
                  <span className="mt-1 block text-[12.5px] font-semibold tracking-tight">
                    {samePrice ? money(minPrice) : `от ${money(minPrice)}`}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {selectedHere?.label ??
                      (single
                        ? `остаток ${qtyFmt(left)}`
                        : `${g.variants.length} вар. · остаток ${qtyFmt(left)}`)}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => form.setAtomizerId(null)}
              className={`${CARD_BASE} w-[128px] ${atomizerId === null ? CARD_ON : `${CARD_OFF} border-dashed`}`}
            >
              {atomizerId === null && <CardCheck />}
              <span className="block text-[12.5px] font-medium leading-snug">Без атомайзера</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">клиент со своим</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <BackLink onClick={() => form.setAtomizerGroup(null)}>
            {atomizerGroup.model}
            <span className="text-muted-foreground/60">· ко всем атомайзерам</span>
          </BackLink>
          <div className="flex max-h-[48vh] flex-wrap justify-center gap-2.5 overflow-y-auto p-1">
            {[...atomizerGroup.variants]
              .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''))
              .map((v) => {
                const on = atomizerId === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      form.setAtomizerId(v.id)
                      form.setAtomizerGroup(null)
                    }}
                    className={`${CARD_BASE} w-[128px] ${on ? CARD_ON : CARD_OFF}`}
                  >
                    {on && <CardCheck />}
                    <span className="line-clamp-2 text-[12.5px] font-medium leading-snug">
                      {v.label ?? atomizerGroup.model}
                    </span>
                    <span className="mt-1 block text-[12.5px] font-semibold tracking-tight">
                      {v.priceMinor != null ? money(v.priceMinor) : '—'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      остаток {qtyFmt(v.qty - inCartQty(v.id))}
                    </span>
                  </button>
                )
              })}
          </div>
        </>
      )}

      <div className="mt-5 flex flex-col items-center gap-2.5 border-t border-border/60 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          {activeMl != null && (
            <>
              Налить <b className="text-foreground">{qtyFmt(activeMl)} мл</b> ·{' '}
              <b className="text-foreground">{money(Math.round(activeMl * perSprayMl))}</b>
              {selectedAtomizer && (
                <span className="text-muted-foreground">
                  {' + атомайзер '}
                  {atomizerLabel(selectedAtomizer)}
                  {selectedAtomizer.priceMinor != null && ` (${money(selectedAtomizer.priceMinor)})`}
                </span>
              )}
            </>
          )}
        </p>
        <Button
          disabled={activeMl == null}
          onClick={() =>
            form.activeOilMl != null &&
            onPick(form.activeOilMl, form.perMl, selectedAtomizer, form.dilutable ? form.pct : undefined)
          }
          className="h-12 w-full text-base"
        >
          Добавить в чек
        </Button>
      </div>
    </>
  )
}
