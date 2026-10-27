import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Boxes, IdCard, Package, Pencil, Plus, Tags } from 'lucide-react'
import {
  Badge,
  Button,
  Switch,
  PageLoader,
  Spinner,
  ConfirmPanel,
  StatusChip,
  useSort,
  SortTh,
} from '@/shared/ui'
import {
  createProductModel,
  fetchAllProducts,
  fetchBrandsPage,
  fetchProductModel,
  fetchProductModelsPage,
  toggleProductModelArchive,
  updateProductModel,
  type ProductModel,
  queryKeys,
} from '@/shared/api'
import { PRODUCT_GENDER_LABELS, modelTitle } from '@/pages/admin/lib/labels'
import { useKindLabels } from '@/entities/kind/useKinds'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import {
  KpiCard,
  ListEmpty,
  ListShell,
  ListStats,
  ListTable,
  ListToolbar,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'
import {
  FastView,
  FastViewHeader,
  FastViewNav,
  FastViewNavButton,
  FastViewPortal,
} from '@/pages/admin/layout/FastView'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import {
  EMPTY_MODEL_FORM,
  ProductModelForm,
  modelFormToRequest,
  modelToForm,
  type ProductModelFormState,
} from './ProductModelForm'

type ModelPanel = 'info' | 'archive'

/** Продукты: товары разных форм одного аромата. */
export function ProductModelsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [q, setQ] = useState('')
  const [form, setForm] = useState<ProductModelFormState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<ModelPanel>('info')

  const { sort, toggle } = useSort({ key: 'brand', dir: 'asc' })
  const list = useInfiniteList(queryKeys.productModels.list(q, showArchived, sort), (page) =>
    fetchProductModelsPage(page, q, showArchived, sort),
  )

  // для KPI нужен только totalItems первой страницы
  const brandsStats = useQuery({
    queryKey: queryKeys.brands.count,
    queryFn: () => fetchBrandsPage(0),
  })
  const formsStats = useQuery({
    queryKey: queryKeys.products.count,
    queryFn: () => fetchAllProducts(0),
  })

  const selected = selectedId ? (list.rows.find((m) => m.id === selectedId) ?? null) : null
  const full = useQuery({
    queryKey: queryKeys.productModels.detail(selectedId),
    queryFn: () => fetchProductModel(selectedId as string),
    enabled: selectedId != null,
  })

  useEffect(() => setSelectedId(null), [showArchived])
  useEffect(() => setPanel('info'), [selectedId])

  const save = useEntityMutation({
    mutationFn: (f: ProductModelFormState) =>
      f.id ? updateProductModel(f.id, modelFormToRequest(f)) : createProductModel(modelFormToRequest(f)),
    invalidate: [queryKeys.productModels.all],
    onDone: () => setForm(null),
  })

  const archive = useEntityMutation({
    mutationFn: toggleProductModelArchive,
    invalidate: [queryKeys.productModels.all],
    onDone: () => setPanel('info'),
  })

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего продуктов"
          value={list.total ? String(list.total) : '…'}
          sub="моделей парфюма"
          icon={Package}
          dark
        />
        <KpiCard
          label="Брендов"
          value={brandsStats.data ? String(brandsStats.data.totalItems) : '…'}
          sub="в каталоге"
          icon={Tags}
          dark
        />
        <KpiCard
          label="Форм выпуска"
          value={formsStats.data ? String(formsStats.data.totalItems) : '…'}
          sub="товаров всего"
          icon={Boxes}
          tone="good"
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск по бренду или названию…"
        filtersCount={showArchived ? 1 : 0}
        filters={<Switch checked={showArchived} onChange={setShowArchived} label="показывать архивные" />}
      >
        <Button onClick={() => setForm({ ...EMPTY_MODEL_FORM })}>
          <Plus className="mr-2 h-4 w-4" />
          Новый продукт
        </Button>
      </ListToolbar>

      {form && (
        <EditorModal
          maxWidth="max-w-2xl"
          onClose={() => {
            setForm(null)
            save.clearError()
          }}
        >
          <ProductModelForm
            form={form}
            setForm={setForm}
            error={save.error}
            busy={save.isPending}
            onSubmit={() => save.mutate(form)}
            onClose={() => {
              setForm(null)
              save.clearError()
            }}
          />
        </EditorModal>
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : list.rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Package className="h-10 w-10" strokeWidth={1.25} />}>
          {q ? 'Ничего не найдено' : 'Продуктов нет — создайте первый'}
        </ListEmpty>
      ) : (
        <ListTable ref={list.rootRef}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Бренд" sortKey="brand" sort={sort} onSort={toggle} />
                <SortTh label="Продукт" sortKey="name" sort={sort} onSort={toggle} />
                {!selected && <th className="px-4 py-3 font-medium">Формы</th>}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                    selectedId === m.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                  } ${m.archived ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 text-muted-foreground">{m.brand ?? '—'}</td>
                  <td className="px-4 py-3 font-medium" data-label="Продукт">
                    {m.name}
                    {m.archived && (
                      <Badge variant="outline" className="ml-2">
                        архив
                      </Badge>
                    )}
                  </td>
                  {!selected && (
                    <td className="px-4 py-3 text-muted-foreground" data-label="Формы">
                      {m.forms} форм
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </ListTable>
      )}

      <FastViewPortal open={selected != null}>
        {selected && (
          <FastView
            onClose={() => setSelectedId(null)}
            nav={
              <FastViewNav>
                <FastViewNavButton
                  icon={IdCard}
                  label="Основная информация"
                  active={panel === 'info'}
                  onClick={() => setPanel('info')}
                />
                <FastViewNavButton
                  icon={Pencil}
                  label="Редактировать"
                  onClick={() => setForm(modelToForm(selected))}
                />
                <FastViewNavButton
                  icon={selected.archived ? ArchiveRestore : Archive}
                  label={selected.archived ? 'Вернуть из архива' : 'В архив'}
                  active={panel === 'archive'}
                  tone={selected.archived ? 'success' : 'danger'}
                  onClick={() => setPanel('archive')}
                />
              </FastViewNav>
            }
            header={
              <FastViewHeader icon={Package}>
                <StatusChip
                  tone={selected.archived ? 'archived' : 'active'}
                  dot
                  className="absolute left-4 top-3.5 z-10"
                >
                  {selected.archived ? 'в архиве' : 'активен'}
                </StatusChip>
                <div className="min-w-0 flex-1">
                  {selected.brand && (
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{selected.brand}</p>
                  )}
                  <h2 className="font-display text-xl leading-tight tracking-tight line-clamp-2">
                    {selected.name}
                  </h2>
                </div>
              </FastViewHeader>
            }
          >
            {panel === 'info' &&
              (full.data ? (
                <ProductModelInfo model={full.data} />
              ) : (
                <div className="flex justify-center py-10">
                  <Spinner className="h-6 w-6" />
                </div>
              ))}

            {panel === 'archive' && (
              <ConfirmPanel
                tone={selected.archived ? 'success' : 'danger'}
                icon={selected.archived ? ArchiveRestore : Archive}
                title={selected.archived ? 'Вернуть из архива?' : 'Отправить в архив?'}
                description={
                  <>
                    <span className="font-medium text-foreground">
                      {modelTitle(selected.brand, selected.name)}
                    </span>{' '}
                    {selected.archived ? 'снова появится в каталоге.' : 'скроется из каталога.'}
                  </>
                }
                confirmLabel={selected.archived ? 'Вернуть из архива' : 'В архив'}
                cancelLabel="Отмена"
                busy={archive.isPending}
                onConfirm={() => archive.mutate(selected)}
                onCancel={() => setPanel('info')}
              />
            )}
          </FastView>
        )}
      </FastViewPortal>
    </ListShell>
  )
}

/** Формы выпуска продукта, пол и описание. */
function ProductModelInfo({ model }: { model: ProductModel }) {
  const kindLabel = useKindLabels()
  const activeSkus = model.skus.filter((s) => !s.archived)

  return (
    <div className="space-y-4 px-6 py-5 text-sm">
      <div>
        <span className="mb-1 block text-xs text-muted-foreground">Формы выпуска</span>
        {activeSkus.length === 0 ? (
          <span className="text-muted-foreground">Форм выпуска нет</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activeSkus.map((s) => (
              <span key={s.id} className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-xs">
                {kindLabel(s.kind)}
                {s.volumeMl != null ? ` ${s.volumeMl} мл` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {model.gender && (
        <div>
          <span className="mb-0.5 block text-xs text-muted-foreground">Пол</span>
          <p>{PRODUCT_GENDER_LABELS[model.gender]}</p>
        </div>
      )}

      {model.description && (
        <div>
          <span className="mb-0.5 block text-xs text-muted-foreground">Описание</span>
          <p className="whitespace-pre-wrap">{model.description}</p>
        </div>
      )}
    </div>
  )
}
