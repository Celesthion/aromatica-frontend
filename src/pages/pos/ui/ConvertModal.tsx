import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Droplets, FlaskRound, Minus, Plus } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Modal, SearchInput, Spinner } from '@/shared/ui'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import {
  fetchPosSplitInfo,
  posConvert,
  searchPosProducts,
  type PosProduct,
  type PosShift,
  queryKeys,
} from '@/shared/api'

/**
 * Вскрытие флакона или тестера в распив прямо у прилавка, когда открытого флакона нет.
 * Объём считает бэк по карточке товара: ручной ввод легко ошибочен и сбивает себестоимость.
 */
export function ConvertModal({
  shift,
  initialSearch,
  onClose,
  onDone,
}: {
  shift: PosShift
  /** Начальный текст поиска. Если распива не хватило, аромат уже известен и искать его заново не нужно. */
  initialSearch?: string
  onClose: () => void
  /** Вскрытие прошло: страница перезапрашивает витрину, чтобы распив появился сразу. */
  onDone: (splitName: string, ml: number) => void
}) {
  const [search, setSearch] = useState(initialSearch ?? '')
  const [picked, setPicked] = useState<PosProduct | null>(null)
  const [pcs, setPcs] = useState(1)
  const queryClient = useQueryClient()

  // ищем по каталогу кассы: там только позиции с остатком, а вскрыть можно только их
  const products = useQuery({
    queryKey: queryKeys.pos.products.convert(search, shift.warehouseId),
    queryFn: () => searchPosProducts(search, shift.warehouseId),
    placeholderData: (prev) => prev,
  })
  const openable = (products.data ?? []).filter(
    (p) => (p.kind === 'BOTTLE' || p.kind === 'TESTER') && p.qty > 0 && p.volumeMl != null,
  )

  // есть ли распив у аромата и почём. Спрашиваем только для выбранного, не для каждой строки
  const split = useQuery({
    queryKey: queryKeys.pos.convertSplit(picked?.id),
    queryFn: () => fetchPosSplitInfo(picked!.id),
    enabled: picked != null,
  })

  const ml = picked?.volumeMl != null ? picked.volumeMl * pcs : 0
  const noSplit = split.data != null && !split.data.exists

  const convert = useMutation({
    mutationFn: () => posConvert(shift.id, { sourceProductId: picked!.id, sourcePcs: pcs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
      onDone(split.data?.name ?? 'распив', ml)
    },
  })

  if (picked) {
    return (
      <Modal onClose={onClose} title="Вскрыть в распив" maxWidth="max-w-md">
        <p className="text-sm font-medium">{picked.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          остаток {qtyFmt(picked.qty)} {UNIT_LABELS[picked.unit]} · в одной штуке{' '}
          {qtyFmt(picked.volumeMl ?? 0)} мл
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
          <span className="text-sm text-muted-foreground">Сколько вскрыть</span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              disabled={pcs <= 1}
              onClick={() => setPcs((n) => Math.max(1, n - 1))}
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 transition hover:bg-secondary disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-base font-semibold tabular-nums">{pcs}</span>
            <button
              type="button"
              disabled={pcs >= picked.qty}
              onClick={() => setPcs((n) => Math.min(picked.qty, n + 1))}
              className="grid h-8 w-8 place-items-center rounded-full border border-border/70 transition hover:bg-secondary disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm">
          {split.isLoading ? (
            <Spinner className="mx-auto my-1" />
          ) : noSplit ? (
            <p className="text-destructive">
              У этого аромата ещё нет распива. Заведите его в каталоге с ценой за мл — с кассы создать нельзя,
              иначе получится позиция без цены.
            </p>
          ) : (
            <>
              <p className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Получится</span>
                <span className="font-semibold tabular-nums">{qtyFmt(ml)} мл</span>
              </p>
              <p className="mt-1 flex items-baseline justify-between text-xs text-muted-foreground">
                <span className="min-w-0 truncate">{split.data?.name}</span>
                {split.data?.priceMinor != null && (
                  <span className="shrink-0">{money(split.data.priceMinor)}/мл</span>
                )}
              </p>
            </>
          )}
        </div>

        <ErrorNote error={convert.error} className="mt-3" />

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="h-11 flex-1" onClick={() => setPicked(null)}>
            Назад
          </Button>
          <Button
            className="h-11 flex-1"
            disabled={noSplit || split.isLoading || convert.isPending}
            onClick={() => convert.mutate()}
          >
            {convert.isPending ? <ButtonSpinner /> : 'Вскрыть'}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title="Вскрыть в распив" maxWidth="max-w-md">
      <SearchInput
        initialValue={initialSearch}
        onSearch={setSearch}
        placeholder="Флакон или тестер…"
        autoFocus
      />

      {products.isLoading && <Spinner className="mx-auto my-8" />}
      {!products.isLoading && openable.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {search ? 'Ничего не найдено' : 'Нет флаконов и тестеров с остатком'}
        </p>
      )}

      <div className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto pr-1">
        {openable.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPicked(p)
              setPcs(1)
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-secondary"
          >
            {p.kind === 'TESTER' ? (
              <FlaskRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            ) : (
              <Droplets className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{p.name}</span>
              <span className="block text-xs text-muted-foreground">
                остаток {qtyFmt(p.qty)} шт · даёт {qtyFmt(p.volumeMl ?? 0)} мл
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
