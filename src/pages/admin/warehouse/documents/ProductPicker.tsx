import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { SearchInput, type SearchInputHandle } from '@/shared/ui'
import { useOutsideClick } from '@/shared/lib/useOutsideClick'
import { createProduct, type ProductKind, type ProductPick, queryKeys } from '@/shared/api'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { useProductSearch } from '@/pages/admin/lib/useProductSearch'
import { ProductForm } from '@/pages/admin/catalog/ProductForm'
import {
  EMPTY_PRODUCT_FORM,
  productFormToRequest,
  type ProductFormState,
} from '@/pages/admin/catalog/productFormModel'

/** Поиск товара с созданием на лету. excludeKinds: формы, которые здесь не подходят. */
export function ProductPicker({
  onPick,
  excludeKinds = [],
}: {
  onPick: (p: ProductPick) => void
  excludeKinds?: ProductKind[]
}) {
  const [open, setOpen] = useState(false)
  const searchRef = useRef<SearchInputHandle>(null)
  const rootRef = useOutsideClick<HTMLDivElement>(() => setOpen(false))
  const [form, setForm] = useState<ProductFormState | null>(null)
  const search = useProductSearch()
  const found = search.products.filter((p) => !excludeKinds.includes(p.kind))

  const resetSearch = () => {
    search.setQuery('')
    searchRef.current?.clear()
    setOpen(false)
  }

  const create = useEntityMutation({
    mutationFn: (f: ProductFormState) => createProduct(productFormToRequest(f)),
    invalidate: [queryKeys.productSearch.all, queryKeys.products.all],
    onDone: (p) => {
      onPick({
        id: p.id,
        name: p.name,
        article: p.article,
        priceKopecks: p.priceKopecks,
        unit: p.unit,
        kind: p.kind,
      })
      setForm(null)
      resetSearch()
    },
  })

  const openCreate = () => {
    create.clearError()
    setForm({ ...EMPTY_PRODUCT_FORM })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative mb-4 max-w-xl" onFocusCapture={() => setOpen(true)}>
      <SearchInput
        ref={searchRef}
        placeholder="Найти товар (мин. 2 символа)…"
        delay={250}
        inputClassName="pr-11"
        onSearch={(q) => {
          search.setQuery(q)
          setOpen(true)
        }}
      />
      <button
        type="button"
        title="Новый товар"
        onClick={openCreate}
        className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand-green/10 hover:text-brand-green"
      >
        <Plus className="h-4 w-4" />
      </button>

      {open && search.ready && (
        <div
          ref={search.listRef}
          onScroll={search.onScroll}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-lg"
        >
          {search.isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Ищем…</div>
          ) : found.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Ничего не найдено</div>
          ) : (
            <>
              {found.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted"
                  // Safari теряет click после preventDefault, поэтому onMouseDown
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onPick(p)
                    resetSearch()
                  }}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.article}</span>
                </button>
              ))}
              {search.isFetchingNextPage && (
                <div className="px-4 py-2 text-sm text-muted-foreground">Ещё…</div>
              )}
            </>
          )}
        </div>
      )}

      {form && (
        <EditorModal maxWidth="max-w-3xl" onClose={() => setForm(null)}>
          <ProductForm
            form={form}
            setForm={setForm}
            error={create.error}
            busy={create.isPending}
            onSubmit={() => create.mutate(form)}
            onClose={() => setForm(null)}
          />
        </EditorModal>
      )}
    </div>
  )
}
