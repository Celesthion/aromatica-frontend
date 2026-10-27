import { useEffect, useMemo, useState, type RefObject } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Droplets, Expand, ListOrdered, LogOut, Receipt, Shrink, Ticket } from 'lucide-react'
import { ACTIVE_PILL, SearchInput, type SearchInputHandle, Spinner } from '@/shared/ui'
import { type ProductKindInfo, type PosShift, queryKeys, searchPosProducts } from '@/shared/api'
import { useAdminChrome } from '@/shared/lib/adminChrome'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'
import { groupProducts } from '@/pages/pos/lib/grouping'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { KindChip } from './KindChip'
import type { Overlay } from './overlay'
import { ProductCard } from './ProductCard'
import { ShiftMenu } from './ShiftMenu'

/** Круглая стеклянная кнопка, как в боковой панели админки. */
const ROUND_BUTTON =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full border border-glass-line bg-glass text-foreground/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_4px_14px_-6px_rgba(0,8,20,0.5)] backdrop-blur-xl backdrop-saturate-150 transition-colors hover:border-glass-edge hover:bg-glass-hover hover:text-foreground'

/** Левая колонка кассы: фильтр по форме, поиск, действия смены и сетка товаров. */
export function CatalogPanel({
  shift,
  searchRef,
  kindLabel,
  kindStyle,
  onOpenGroup,
  onOpen,
}: {
  shift: PosShift
  searchRef: RefObject<SearchInputHandle>
  kindLabel: (kind: string) => string
  kindStyle: Map<string, ProductKindInfo>
  onOpenGroup: (group: ProductGroup) => void
  onOpen: (overlay: Overlay) => void
}) {
  // строка поиска после дебаунса, сам дебаунс внутри SearchInput
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState('')
  const chrome = useAdminChrome()

  const products = useQuery({
    queryKey: queryKeys.pos.products.search(query, shift.warehouseId),
    queryFn: () => searchPosProducts(query, shift.warehouseId),
    placeholderData: (prev) => prev,
  })
  const found = useMemo(() => products.data ?? [], [products.data])
  // чипы строим по тому, что реально нашлось
  const kindChips = useMemo(() => [...new Set(found.map((p) => p.kind))], [found])
  const shownProducts = useMemo(
    () => (kindFilter ? found.filter((p) => p.kind === kindFilter) : found),
    [found, kindFilter],
  )
  const groups = useMemo(() => groupProducts(shownProducts), [shownProducts])
  const kindPill = useSlidingPill<HTMLDivElement>(kindFilter, { deps: kindChips.join() })

  // выбранной формы больше нет в выдаче: снимаем фильтр
  useEffect(() => {
    if (kindFilter && !kindChips.includes(kindFilter)) setKindFilter('')
  }, [kindFilter, kindChips])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-4 pb-0 lg:pb-4 lg:pr-4">
      <div className="flex shrink-0 items-center gap-2">
        {kindChips.length > 1 && (
          <div
            ref={kindPill.navRef}
            className="no-scrollbar relative flex min-w-0 max-w-full shrink gap-0.5 overflow-x-auto rounded-full border border-glass-line bg-glass p-1 shadow-soft-sm backdrop-blur-xl backdrop-saturate-150"
          >
            {kindPill.rect && <span aria-hidden className={ACTIVE_PILL} style={kindPill.rect} />}
            <KindChip
              active={kindFilter === ''}
              onClick={() => setKindFilter('')}
              chipRef={kindPill.setItemRef('')}
            >
              Все
            </KindChip>
            {kindChips.map((k) => (
              <KindChip
                key={k}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
                chipRef={kindPill.setItemRef(k)}
              >
                {kindLabel(k)}
              </KindChip>
            ))}
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SearchInput
            ref={searchRef}
            onSearch={setQuery}
            placeholder="Поиск"
            className="w-44 shrink-0"
            clearable
            inputClassName="h-10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                searchRef.current?.clear()
                setQuery('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => chrome.setFullscreen(!chrome.fullscreen)}
            title={chrome.fullscreen ? 'Показать меню' : 'Скрыть меню'}
            aria-pressed={chrome.fullscreen}
            className={ROUND_BUTTON}
          >
            {chrome.fullscreen ? (
              <Shrink className="h-[18px] w-[18px]" strokeWidth={1.7} />
            ) : (
              <Expand className="h-[18px] w-[18px]" strokeWidth={1.7} />
            )}
          </button>
          <ShiftMenu
            triggerClassName={ROUND_BUTTON}
            items={[
              { icon: ListOrdered, label: 'Чеки', onClick: () => onOpen({ kind: 'receipts' }) },
              { icon: Droplets, label: 'Вскрыть в распив', onClick: () => onOpen({ kind: 'convert' }) },
              { icon: Ticket, label: 'Продать сертификат', onClick: () => onOpen({ kind: 'certSale' }) },
              { icon: Receipt, label: 'X-отчёт', onClick: () => onOpen({ kind: 'summary' }) },
              {
                icon: LogOut,
                label: 'Закрыть смену',
                tone: 'danger',
                onClick: () => onOpen({ kind: 'closing' }),
              },
            ]}
          />
        </div>
      </div>
      {/* pt-1: запас под hover-подъём карточки */}
      <div className="min-h-0 flex-1 overflow-y-auto px-0.5 pt-1">
        {products.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : shownProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Ничего не найдено</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
            {groups.map((g) => (
              <ProductCard
                key={g.key}
                group={g}
                kindLabel={kindLabel(g.kind)}
                kindInfo={kindStyle.get(g.kind)}
                onClick={() => onOpenGroup(g)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
