import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Package, PackageX, Plus, TrendingDown, Wallet } from 'lucide-react'
import { Button, PageLoader, SearchInput, SortTh, Switch, useSort } from '@/shared/ui'
import {
  createProduct,
  fetchAllProducts,
  fetchStock,
  fetchStockSummary,
  fetchWarehouses,
  toggleProductArchive,
  updateProduct,
  queryKeys,
} from '@/shared/api'
import { money } from '@/shared/lib/format'
import { useKindLabels, useKinds } from '@/entities/kind/useKinds'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import { FastViewPortal } from '@/pages/admin/layout/FastView'
import { FiltersButton } from '@/pages/admin/layout/FiltersButton'
import {
  KpiCard,
  ListEmpty,
  ListShell,
  ListStats,
  ListTable,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import { ProductFastView, type ProductPanel } from './ProductFastView'
import { ProductForm } from './ProductForm'
import {
  EMPTY_PRODUCT_FORM,
  productFormToRequest,
  productToForm,
  type ProductFormState,
} from './productFormModel'
import { ProductRow } from './ProductRow'

// потолок страницы на сервере: 200
const STOCK_CHUNK = 200

const PRODUCTS_KEYS = [queryKeys.products.all, queryKeys.productSearch.all] as const

/** Каталог товаров: список и фаст-вью, форма товара в модалке. */
export function ProductsPage() {
  const kindLabel = useKindLabels()
  const kinds = useKinds()
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState<ProductFormState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<ProductPanel>('info')

  const { sort, toggle } = useSort({ key: 'name', dir: 'asc' })
  const list = useInfiniteList(queryKeys.products.list(q, showArchived, sort), (page) =>
    fetchAllProducts(page, q, showArchived, sort),
  )

  const warehouses = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  })

  const summary = useQuery({
    queryKey: queryKeys.stock.summary(''),
    queryFn: () => fetchStockSummary(),
  })

  // остатки только загруженных строк, пачками по размеру страницы
  const loadedIds = list.rows.map((p) => p.id)
  const stockOfRows = useQuery({
    queryKey: queryKeys.stock.rows(loadedIds.join(',')),
    enabled: loadedIds.length > 0,
    queryFn: async () => {
      const chunks: string[][] = []
      for (let i = 0; i < loadedIds.length; i += STOCK_CHUNK) chunks.push(loadedIds.slice(i, i + STOCK_CHUNK))
      const pages = await Promise.all(chunks.map((ids) => fetchStock({ size: STOCK_CHUNK, productIds: ids })))
      return pages.flatMap((p) => p.items)
    },
  })
  const stockMap = new Map((stockOfRows.data ?? []).map((r) => [r.productId, r]))

  const rows = list.rows
  const selected = selectedId ? (rows.find((p) => p.id === selectedId) ?? null) : null

  // после смены фильтров выбранной строки может не быть в списке
  useEffect(() => setSelectedId(null), [q, showArchived])
  useEffect(() => setPanel('info'), [selectedId])

  const warehouseList = warehouses.data ?? []
  const stock = useQuery({
    queryKey: queryKeys.products.stock(selectedId, warehouseList.map((w) => w.id).join(',')),
    enabled: selected != null && warehouseList.length > 0 && panel === 'stock',
    queryFn: () =>
      Promise.all(
        warehouseList.map(async (w) => {
          const resp = await fetchStock({ warehouseId: w.id, size: 1, productIds: [selected!.id] })
          const row = resp.items[0]
          return { id: w.id, name: w.name, qty: row?.qty ?? 0, unit: row?.unit ?? selected!.unit }
        }),
      ),
  })

  const save = useEntityMutation({
    mutationFn: (f: ProductFormState) =>
      f.id ? updateProduct(f.id, productFormToRequest(f)) : createProduct(productFormToRequest(f)),
    invalidate: PRODUCTS_KEYS,
    onDone: () => setForm(null),
  })

  const archive = useEntityMutation({
    mutationFn: toggleProductArchive,
    invalidate: PRODUCTS_KEYS,
    onDone: () => setPanel('info'),
  })

  const closeForm = () => {
    setForm(null)
    save.clearError()
  }

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего позиций"
          value={list.total ? String(list.total) : '…'}
          sub={kinds.data ? `${kinds.data.length} категорий` : undefined}
          icon={Boxes}
          dark
        />
        <KpiCard
          label="Заканчиваются"
          value={summary.data ? String(summary.data.low) : '…'}
          sub="остаток ниже нормы"
          icon={TrendingDown}
          tone="warn"
          dark
        />
        <KpiCard
          label="Нет в наличии"
          value={summary.data ? String(summary.data.out) : '…'}
          sub="нужен дозаказ"
          icon={PackageX}
          tone="bad"
          dark
        />
        <KpiCard
          label="Стоимость склада"
          value={summary.data ? money(summary.data.totalValueMinor) : '…'}
          sub="по закупочным ценам"
          icon={Wallet}
          tone="good"
          dark
        />
      </ListStats>

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2.5">
        <Button onClick={() => setForm({ ...EMPTY_PRODUCT_FORM })}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
        <div className="relative min-w-[12rem] flex-1">
          <SearchInput
            onSearch={setQ}
            placeholder="Поиск товара…"
            className="w-full"
            inputClassName="h-11 pr-12"
          />
          <div className="absolute right-1.5 top-1/2 z-40 -translate-y-1/2">
            <FiltersButton activeCount={showArchived ? 1 : 0} align="right">
              <Switch checked={showArchived} onChange={setShowArchived} label="показывать архивные" />
            </FiltersButton>
          </div>
        </div>
      </div>

      {form && (
        <EditorModal maxWidth="max-w-3xl" onClose={closeForm}>
          <ProductForm
            form={form}
            setForm={setForm}
            error={save.error}
            busy={save.isPending}
            onSubmit={() => save.mutate(form)}
            onClose={closeForm}
          />
        </EditorModal>
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Package className="h-10 w-10" />}>
          {q || showArchived ? 'Ничего не найдено' : 'Товаров нет'}
        </ListEmpty>
      ) : (
        <ListTable ref={list.rootRef}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Товар" sortKey="name" sort={sort} onSort={toggle} />
                {!selected && <SortTh label="Категория" sortKey="kind" sort={sort} onSort={toggle} />}
                {!selected && <th className="px-4 py-3 font-medium">Остаток</th>}
                <SortTh label="Цена" sortKey="price" sort={sort} onSort={toggle} align="right" />
                {!selected && <th className="px-4 py-3 font-medium">Статус</th>}
                {!selected && <th className="w-10 px-2 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  stock={stockMap.get(p.id)}
                  selected={selectedId === p.id}
                  compact={selected != null}
                  kindLabel={kindLabel}
                  onOpen={() => setSelectedId(p.id)}
                />
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </ListTable>
      )}

      <FastViewPortal open={selected != null}>
        {selected && (
          <ProductFastView
            product={selected}
            panel={panel}
            onPanel={setPanel}
            onEdit={() => setForm(productToForm(selected))}
            onClose={() => setSelectedId(null)}
            kindLabel={kindLabel}
            stock={stock.data}
            stockLoading={stock.isLoading}
            archiving={archive.isPending}
            onArchive={() => archive.mutate(selected)}
          />
        )}
      </FastViewPortal>
    </ListShell>
  )
}
