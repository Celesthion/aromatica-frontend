import { useEffect, useRef } from 'react'
import { keepPreviousData, useInfiniteQuery, type QueryKey } from '@tanstack/react-query'

/** Ответ с числом страниц или только hasNext (журналы). */
type PagedLike<T> = { items: T[]; totalPages: number; totalItems: number } | { items: T[]; hasNext: boolean }

/** Бесконечный список: догружает страницу у нижнего края контейнера rootRef. */
export function useInfiniteList<P extends PagedLike<unknown>>(
  key: QueryKey,
  fetchPage: (page: number) => Promise<P>,
  options?: { refetchInterval?: number },
) {
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastParam) => {
      const more = 'hasNext' in last ? last.hasNext : lastParam + 1 < last.totalPages
      return more ? lastParam + 1 : undefined
    },
    // при новом поиске таблица и поле поиска остаются на месте, пока грузится ответ
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval,
  })

  const rows = (query.data?.pages.flatMap((p) => p.items) ?? []) as P['items']
  const firstPage = query.data?.pages[0] as P | undefined
  // у журналов общего числа нет: total остаётся 0
  const total = firstPage && 'totalItems' in firstPage ? firstPage.totalItems : 0
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  // scroll на контейнере: IntersectionObserver для вложенного скролла ненадёжен
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onScroll = () => {
      if (
        root.scrollTop + root.clientHeight >= root.scrollHeight - 300 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage()
      }
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // если контента меньше высоты контейнера, scroll не случится
    return () => root.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rows.length])

  return {
    rows,
    total,
    rootRef,
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage,
    // ручная догрузка для панелей без своего скролла
    fetchNextPage,
  }
}
