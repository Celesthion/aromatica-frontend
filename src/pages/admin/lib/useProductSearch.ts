import { useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { searchProducts, queryKeys } from '@/shared/api'

const MIN_PRODUCT_QUERY = 2

/** Поиск товаров для выпадающего списка; следующая страница грузится при прокрутке listRef. */
export function useProductSearch(kind?: string) {
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const ready = query.trim().length >= MIN_PRODUCT_QUERY

  const results = useInfiniteQuery({
    queryKey:
      kind === undefined
        ? queryKeys.productSearch.byQuery(query)
        : queryKeys.productSearch.byKind(query, kind),
    queryFn: ({ pageParam }) => searchProducts(query, kind, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastParam) =>
      lastParam + 1 < last.totalPages ? lastParam + 1 : undefined,
    enabled: ready,
  })

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 48 &&
      results.hasNextPage &&
      !results.isFetchingNextPage
    ) {
      void results.fetchNextPage()
    }
  }

  return {
    query,
    setQuery,
    ready,
    products: results.data?.pages.flatMap((p) => p.items) ?? [],
    isLoading: results.isLoading,
    isFetchingNextPage: results.isFetchingNextPage,
    listRef,
    onScroll,
  }
}
