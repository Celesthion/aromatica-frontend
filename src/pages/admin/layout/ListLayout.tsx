import { forwardRef, type ComponentType, type ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import { PageLoader, SearchInput } from '@/shared/ui'
import { FiltersButton } from './FiltersButton'

/** Каркас страницы-списка: таблица занимает остаток высоты и прокручивается внутри. */
export function ListShell({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col">{children}</div>
}

export function ListStats({ columns = 4, children }: { columns?: 3 | 4; children: ReactNode }) {
  return (
    <div
      className={`mb-3 grid shrink-0 gap-3 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
    >
      {children}
    </div>
  )
}

type KpiTone = 'slate' | 'warn' | 'bad' | 'good'

// на тёмном фоне цвета светлее
const KPI_TONES: Record<KpiTone, { light: string; dark: string }> = {
  slate: { light: 'bg-brand-slate/12 text-brand-slate', dark: 'bg-brand-slate/25 text-brand-slate-mist' },
  warn: { light: 'bg-brand-warn/12 text-brand-warn', dark: 'bg-brand-warn/20 text-brand-warn-soft' },
  bad: { light: 'bg-brand-bad/12 text-brand-bad', dark: 'bg-brand-bad/20 text-brand-bad-soft' },
  good: { light: 'bg-brand-good/12 text-brand-good', dark: 'bg-brand-good-bright/35 text-brand-good-soft' },
}

/** Карточка с числом над списком. tone задаёт цвет иконки. */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  dark,
}: {
  label: string
  value: string
  sub?: string
  icon: ComponentType<LucideProps>
  tone?: KpiTone
  dark?: boolean
}) {
  const chip = KPI_TONES[tone ?? 'slate'][dark ? 'dark' : 'light']
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-xl backdrop-saturate-150 ${
        dark
          ? 'border-glass-line bg-gradient-to-b from-surface-accent-from to-surface-accent-to text-white'
          : 'border-glass-line bg-glass'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-xs ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="whitespace-nowrap text-2xl font-light leading-none tracking-tight tabular-nums">
              {value}
            </span>
            {sub && (
              <span className={`truncate text-[11px] ${dark ? 'text-white/50' : 'text-muted-foreground/70'}`}>
                {sub}
              </span>
            )}
          </div>
        </div>
        {/* 10px вместо rounded-lg: при --radius: 1rem чип 32px стал бы кругом */}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${chip}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  )
}

export function ListToolbar({
  onSearch,
  placeholder = 'Поиск…',
  filters,
  filtersCount = 0,
  children,
}: {
  onSearch?: (q: string) => void
  placeholder?: string
  /** Содержимое панели фильтров; без него кнопки нет. */
  filters?: ReactNode
  filtersCount?: number
  /** Кнопки слева от поиска. */
  children?: ReactNode
}) {
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2.5">
      {children && <div className="flex max-w-full flex-wrap items-center gap-2.5">{children}</div>}
      {onSearch && (
        <div className="relative min-w-[12rem] flex-1">
          <SearchInput
            onSearch={onSearch}
            placeholder={placeholder}
            className="w-full"
            inputClassName={filters ? 'h-11 pr-12' : 'h-11'}
          />
          {filters && (
            // z-40: панель фильтров поверх шапки таблицы
            <div className="absolute right-1.5 top-1/2 z-40 -translate-y-1/2">
              <FiltersButton activeCount={filtersCount} align="right">
                {filters}
              </FiltersButton>
            </div>
          )}
        </div>
      )}
      {!onSearch && filters && <FiltersButton activeCount={filtersCount}>{filters}</FiltersButton>}
    </div>
  )
}

export const ListTable = forwardRef<HTMLDivElement, { loadingMore?: boolean; children: ReactNode }>(
  function ListTable({ loadingMore, children }, ref) {
    return (
      <div
        ref={ref}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-2xl border border-glass-line bg-glass-strong backdrop-blur-xl backdrop-saturate-150"
      >
        {children}
        {loadingMore && <PageLoader size="sm" className="py-3" />}
      </div>
    )
  },
)

/** fill растягивает заглушку на оставшуюся высоту и ставит содержимое по центру. */
export function ListEmpty({
  icon,
  fill = true,
  children,
}: {
  icon?: ReactNode
  fill?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={
        fill
          ? 'flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center text-muted-foreground'
          : 'flex flex-col items-center gap-4 py-24 text-center text-muted-foreground'
      }
    >
      {icon}
      <p>{children}</p>
    </div>
  )
}

export const TABLE = 'w-full text-sm rtable'
export const THEAD = 'sticky top-0 z-10 bg-glass-strong backdrop-blur-xl backdrop-saturate-150'
export const THEAD_TR =
  'border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground'

export function rowClass(opts?: { archived?: boolean; selected?: boolean; clickable?: boolean }) {
  return [
    'border-b border-border/50 last:border-0 transition-colors',
    opts?.clickable ? 'cursor-pointer' : '',
    opts?.selected ? 'bg-muted/60' : 'hover:bg-accent/40',
    opts?.archived ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
