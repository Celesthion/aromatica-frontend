import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useOutsideClick } from '@/shared/lib/useOutsideClick'

/** Страница результатов; по форме совпадает с Paged из shared/api. */
interface ComboboxPage<T> {
  items: T[]
  totalPages: number
}

const SEARCH_DELAY_MS = 250

/**
 * Комбобокс с серверным поиском и бесконечной прокруткой. Первая страница грузится при
 * открытии, следующие у нижнего края списка.
 * Слоты: topItem (пункт над списком) и actions (кнопки в поле).
 */
export function Combobox<T>({
  display,
  placeholder,
  searchPlaceholder = 'Поиск…',
  queryKey,
  fetch,
  itemKey,
  itemLabel,
  isSelected,
  onSelect,
  topItem,
  actions,
}: {
  /** Текст закрытого состояния; если пусто, показываем placeholder. */
  display: ReactNode
  placeholder: ReactNode
  searchPlaceholder?: string
  queryKey: (q: string) => readonly unknown[]
  /** Страница результатов поиска по запросу и номеру страницы. */
  fetch: (q: string, page: number) => Promise<ComboboxPage<T>>
  itemKey: (item: T) => string
  itemLabel: (item: T) => ReactNode
  isSelected?: (item: T) => boolean
  onSelect: (item: T) => void
  /** Пункт над списком, например сброс выбранного значения. */
  topItem?: { label: ReactNode; selected?: boolean; onSelect: () => void }
  /** Кнопки в поле: сброс, добавление. */
  actions?: (ctx: { open: boolean; openField: () => void; query: string }) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(t)
  }, [input])

  const results = useInfiniteQuery({
    queryKey: queryKey(debounced),
    queryFn: ({ pageParam }) => fetch(debounced, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastParam) =>
      lastParam + 1 < last.totalPages ? lastParam + 1 : undefined,
    enabled: open,
  })
  const items = useMemo(() => results.data?.pages.flatMap((p) => p.items) ?? [], [results.data])
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = results

  const rootRef = useOutsideClick<HTMLDivElement>(() => setOpen(false))
  const listRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const openField = () => {
    setInput('')
    setActiveIdx(-1)
    setOpen(true)
  }

  // догружаем следующую страницу у нижнего края списка
  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }

  // для клавиатуры topItem и результаты идут одним списком
  const optionCount = (topItem ? 1 : 0) + items.length
  const runOption = (idx: number) => {
    if (topItem && idx === 0) topItem.onSelect()
    else onSelect(items[idx - (topItem ? 1 : 0)])
    close()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (optionCount ? (i + 1) % optionCount : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (optionCount ? (i - 1 + optionCount) % optionCount : -1))
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < optionCount) {
        e.preventDefault()
        runOption(activeIdx)
      }
    }
  }

  const optionCls = (selected: boolean | undefined, active: boolean, muted = false) =>
    `flex w-full items-center px-4 py-2 text-left text-sm hover:bg-muted ${
      selected ? 'bg-brand-green/[0.06] font-medium' : muted ? 'text-muted-foreground' : ''
    } ${active ? 'bg-muted' : ''}`

  return (
    <div ref={rootRef} className="relative">
      <div className="field flex w-full items-center !pr-1.5 focus-within:border-brand-green/60 focus-within:shadow-[0_0_0_4px_rgb(34_123_99_/_0.14)]">
        {open ? (
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            placeholder={searchPlaceholder}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setActiveIdx(-1)
            }}
            onKeyDown={onKeyDown}
            autoFocus
          />
        ) : (
          <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={openField}>
            {display || <span className="text-muted-foreground/70">{placeholder}</span>}
          </button>
        )}
        <ChevronDown className="pointer-events-none ml-1 mr-1.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
        {actions?.({ open, openField, query: input.trim() })}
      </div>

      {open && (
        <div
          ref={listRef}
          onScroll={onScroll}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-lg"
        >
          {results.isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ищем…
            </div>
          ) : (
            <>
              {topItem && (
                <button
                  type="button"
                  className={optionCls(topItem.selected, activeIdx === 0, true)}
                  // выбор на mousedown, а не на click: Safari теряет click после preventDefault
                  onMouseDown={(e) => {
                    e.preventDefault()
                    runOption(0)
                  }}
                >
                  {topItem.label}
                </button>
              )}
              {items.map((item, i) => {
                const idx = i + (topItem ? 1 : 0)
                return (
                  <button
                    key={itemKey(item)}
                    type="button"
                    className={optionCls(isSelected?.(item), activeIdx === idx)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      runOption(idx)
                    }}
                  >
                    {itemLabel(item)}
                  </button>
                )
              })}
              {items.length === 0 && !topItem && (
                <div className="px-4 py-3 text-sm text-muted-foreground">Ничего не найдено</div>
              )}
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ещё…
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Круглая кнопка внутри поля комбобокса: сброс, добавление. */
export function ComboboxAction({
  title,
  onClick,
  hoverTone = 'muted',
  children,
}: {
  title: string
  onClick: () => void
  hoverTone?: 'muted' | 'brand'
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors ${
        hoverTone === 'brand' ? 'hover:bg-brand-green/10 hover:text-brand-green' : 'hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
