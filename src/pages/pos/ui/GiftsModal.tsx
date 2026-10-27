import { Gift } from 'lucide-react'
import { Modal } from '@/shared/ui'
import { qtyFmt } from '@/shared/lib/format'
import type { PosGiftRule } from '@/shared/api'

function bundleText(r: PosGiftRule): string {
  return r.items
    .map((it) =>
      it.product != null
        ? `${it.product.name} ×${qtyFmt(it.qty)}`
        : `любой «${it.kindName ?? it.kind ?? '?'}» ×${qtyFmt(it.qty)}`,
    )
    .join(' + ')
}

/** Акции, условия которых чек выполнил; исчерпанные видны, но недоступны. */
export function GiftsModal({
  rules,
  earnedCount,
  usedCount,
  onPick,
  onClose,
}: {
  rules: PosGiftRule[]
  earnedCount: (r: PosGiftRule) => number
  usedCount: (ruleId: string) => number
  onPick: (rule: PosGiftRule) => void
  onClose: () => void
}) {
  return (
    <Modal align="center" maxWidth="max-w-lg" onClose={onClose} title="Подарки">
      {rules.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          По этому чеку доступных акций пока нет
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => {
            const earned = earnedCount(r)
            const used = usedCount(r.id)
            const exhausted = used >= earned
            return (
              <button
                key={r.id}
                type="button"
                disabled={exhausted}
                onClick={() => onPick(r)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  exhausted
                    ? 'cursor-not-allowed border-border/50 bg-secondary/40 opacity-60'
                    : 'border-border/60 hover:border-primary hover:bg-primary/[0.04]'
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-green/10 text-brand-green">
                  <Gift className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-muted-foreground">{r.name}</span>
                  <span className="block text-[14px] font-medium leading-snug">{bundleText(r)}</span>
                </span>
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {exhausted ? `выдано ${used} из ${earned}` : `ещё ${earned - used} из ${earned}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
