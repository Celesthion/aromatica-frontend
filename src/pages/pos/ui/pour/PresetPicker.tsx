import { Modal } from '@/shared/ui'
import { money, qtyFmt } from '@/shared/lib/format'
import type { PosProduct } from '@/shared/api'
import { PourAtomizerStep } from './PourAtomizerStep'
import { PourShortfallStep } from './PourShortfallStep'
import { PourVolumeStep } from './PourVolumeStep'
import { usePourForm } from './usePourForm'

/** Налив распива или разлива: объём (пресеты по атомайзерам или свой), затем атомайзер. */
export function PresetPicker({
  product,
  kindName,
  available,
  atomizers,
  inCartQty,
  onClose,
  onPick,
  onShortfall,
  initialMl,
  defaultDilutionPct,
}: {
  product: PosProduct
  /** Имя формы из справочника для подзаголовка. */
  kindName?: string
  /** Сколько мл ещё можно добавить: остаток минус то, что уже в чеке. */
  available: number
  /** Атомайзеры на складе смены; их объёмы и есть пресеты. */
  atomizers: PosProduct[]
  inCartQty: (id: string) => number
  onClose: () => void
  /** Для разлива qty это масло, а не объём флакона: списывается и стоит масло. */
  onPick: (qty: number, unitPriceMinor: number, atomizer: PosProduct | null, dilutionPct?: number) => void
  defaultDilutionPct: number
  /** Флакон кончился раньше учёта: налитое идёт в чек, хвост на списание, остаток долить из нового. */
  onShortfall: (pouredMl: number, writeOffMl: number, shortfallMl: number) => Promise<void>
  /** Сколько осталось долить, если прошлого флакона не хватило. */
  initialMl?: number
}) {
  const form = usePourForm({
    product,
    available,
    atomizers,
    inCartQty,
    initialMl,
    defaultDilutionPct,
    onShortfall,
  })

  return (
    <Modal align="center" maxWidth="max-w-2xl" onClose={onClose} title={product.name}>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {kindName ?? 'Распив'} · {money(form.perSprayMl)}/мл · остаток {qtyFmt(form.sprayAvailable)} мл
        {form.dilutable && <span className="text-muted-foreground/70"> · масла {qtyFmt(available)} мл</span>}
      </p>

      {form.shortfallOpen ? (
        <PourShortfallStep form={form} available={available} />
      ) : available <= 0 ? (
        <p className="grid h-40 place-items-center text-sm text-brand-bad">Весь остаток уже в чеке</p>
      ) : form.stage === 'ml' ? (
        <PourVolumeStep form={form} initialMl={initialMl} />
      ) : (
        <PourAtomizerStep form={form} inCartQty={inCartQty} onPick={onPick} />
      )}

      {/* доступно на обоих шагах: флакон бывает пуст ещё до выбора объёма */}
      {!form.shortfallOpen && available > 0 && (
        <button
          type="button"
          onClick={form.openShortfall}
          className="mx-auto mt-4 block text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition hover:text-foreground"
        >
          Не хватило — флакон кончился
        </button>
      )}
    </Modal>
  )
}
