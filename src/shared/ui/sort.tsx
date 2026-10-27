import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

type SortDir = 'asc' | 'desc'
interface SortState {
  key: string
  dir: SortDir
}

/** Состояние сортировки таблицы; клик по активной колонке переключает направление. */
export function useSort(initial: SortState) {
  const [sort, setSort] = useState<SortState>(initial)
  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  return { sort, toggle }
}

/** Заголовок сортируемой колонки; стрелка показывает активную колонку и направление. */
export function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
  className = '',
}: {
  label: ReactNode
  sortKey: string
  sort: SortState
  onSort: (key: string) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <th className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </th>
  )
}

/** Клиентская сортировка для списков, где весь массив уже на руках. */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  accessors: Record<string, (r: T) => string | number | boolean | null | undefined>,
): T[] {
  const acc = accessors[sort.key]
  if (!acc) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = acc(a)
    const bv = acc(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    if (typeof av === 'boolean' && typeof bv === 'boolean') return (Number(av) - Number(bv)) * dir
    return String(av).localeCompare(String(bv), 'ru') * dir
  })
}
