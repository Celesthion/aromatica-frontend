import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Modal, Spinner } from '@/shared/ui'
import { qtyFmt } from '@/shared/lib/format'
import { fetchGiftKindProducts, type PosItem, type PosProduct, queryKeys } from '@/shared/api'

export function GiftKindPicker({
  item,
  warehouseId,
  inCartQty,
  reservedQty,
  onBack,
  onPick,
}: {
  /** Позиция набора, где товар выбирают по форме. */
  item: PosItem
  warehouseId: string
  inCartQty: (id: string) => number
  /** Сколько этого товара уже занято в собираемом наборе. */
  reservedQty: (id: string) => number
  onBack: () => void
  onPick: (product: PosProduct) => void
}) {
  const need = item.qty
  const [filter, setFilter] = useState('')
  // товары формы в наличии
  const products = useQuery({
    queryKey: queryKeys.pos.giftProducts.list(item.kind, warehouseId),
    queryFn: () => fetchGiftKindProducts(item.kind ?? '', warehouseId),
    enabled: item.kind != null,
  })

  const term = filter.trim().toLowerCase()
  const options = (products.data ?? [])
    .filter((p) => (term ? p.name.toLowerCase().includes(term) : true))
    .map((p) => ({ p, left: p.qty - inCartQty(p.id) - reservedQty(p.id) }))

  return (
    <Modal
      align="center"
      maxWidth="max-w-2xl"
      onClose={onBack}
      title={`Подарок: любой «${item.kindName ?? item.kind}»`}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Выберите товар — {qtyFmt(need)} спишется с его остатка бесплатно
      </p>
      <Input
        className="mb-3"
        placeholder="Найти по названию…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoFocus
      />
      <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-border/60">
        {products.isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : options.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Товаров этой формы нет в наличии</p>
        ) : (
          options.map(({ p, left }) => {
            const enough = left >= need
            return (
              <button
                key={p.id}
                type="button"
                disabled={!enough}
                onClick={() => onPick(p)}
                className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-brand-green/[0.05] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <span className={`shrink-0 text-xs ${enough ? 'text-muted-foreground' : 'text-brand-bad'}`}>
                  {enough ? `остаток ${qtyFmt(left)}` : 'не хватает остатка'}
                </span>
              </button>
            )
          })
        )}
      </div>
      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Назад к подаркам
        </Button>
      </div>
    </Modal>
  )
}
