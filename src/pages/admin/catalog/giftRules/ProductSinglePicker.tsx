import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { SearchInput, type SearchInputHandle } from '@/shared/ui'
import { useOutsideClick } from '@/shared/lib/useOutsideClick'
import type { GiftOption, ProductPick } from '@/shared/api'
import { useProductSearch } from '@/pages/admin/lib/useProductSearch'

/** Выбор одного товара: поиск и чип выбранного. */
export function ProductSinglePicker({
  selected,
  filterKind,
  onChange,
}: {
  selected: GiftOption | null
  filterKind?: string
  onChange: (p: ProductPick | null) => void
}) {
  const [open, setOpen] = useState(false)
  const searchRef = useRef<SearchInputHandle>(null)
  const rootRef = useOutsideClick<HTMLDivElement>(() => setOpen(false))
  // фильтр по форме на сервере: на клиенте он обрезал результаты после лимита выдачи
  const search = useProductSearch(filterKind)

  if (selected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-medium text-brand-green">
        {selected.name}
        <button type="button" onClick={() => onChange(null)}>
          <X className="h-3 w-3" />
        </button>
      </span>
    )
  }

  return (
    <div ref={rootRef} className="relative" onFocusCapture={() => setOpen(true)}>
      <SearchInput
        ref={searchRef}
        placeholder="Найти товар (мин. 2 символа)…"
        delay={250}
        onSearch={(q) => {
          search.setQuery(q)
          setOpen(true)
        }}
      />
      {open && search.ready && search.products.length > 0 && (
        <div
          ref={search.listRef}
          onScroll={search.onScroll}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-background shadow-lg"
        >
          {search.products.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted"
              // Safari теряет click после preventDefault, поэтому onMouseDown
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(p)
                search.setQuery('')
                searchRef.current?.clear()
                setOpen(false)
              }}
            >
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.article}</span>
            </button>
          ))}
          {search.isFetchingNextPage && <div className="px-4 py-2 text-sm text-muted-foreground">Ещё…</div>}
        </div>
      )}
    </div>
  )
}
