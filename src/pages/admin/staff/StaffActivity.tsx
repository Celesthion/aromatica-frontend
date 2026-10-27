import {
  Banknote,
  CalendarDays,
  FileText,
  ListChecks,
  Loader2,
  Receipt,
  Store,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'
import { money } from '@/shared/lib/format'
import type { ActivityItem, SellerStats } from '@/shared/api'
import { Pager } from '@/pages/admin/layout/Pager'

type ActivitySection = ActivityItem['section']

// целое число полностью, с разделителями тысяч
const numFmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n)

const ACTIVITY_ICON: Record<ActivityItem['kind'], LucideIcon> = {
  doc: FileText,
  shift: Store,
  task: ListChecks,
}

// формат "6 авг, 17:20"
function activityWhen(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ACTIVITY_SECTIONS: { key: ActivitySection; label: string; icon: LucideIcon }[] = [
  { key: 'pos', label: 'Касса', icon: Store },
  { key: 'warehouse', label: 'Склад', icon: Warehouse },
  { key: 'money', label: 'Деньги', icon: Banknote },
  { key: 'task', label: 'Задачи', icon: ListChecks },
]

function StatRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-green/15 bg-gradient-to-br from-brand-green/[0.08] to-transparent px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-display text-lg leading-tight tabular-nums">{value}</div>
      </div>
    </div>
  )
}

export function StaffStats({ stats, loading }: { stats: SellerStats | undefined; loading: boolean }) {
  return (
    <div className="space-y-2 px-6 pb-6 pt-5">
      <StatRow icon={Banknote} label="Продано" value={loading ? '…' : money(stats?.soldMinor ?? 0)} />
      <StatRow icon={Receipt} label="Чеков" value={loading ? '…' : numFmt(stats?.salesCount ?? 0)} />
      <StatRow icon={CalendarDays} label="Дней" value={loading ? '…' : numFmt(stats?.daysWorked ?? 0)} />
    </div>
  )
}

/** Лента активности сотрудника; данные грузятся по выбранному разделу. */
export function ActivityFeed({
  items,
  loading,
  section,
  onSelect,
  page,
  hasNext,
  onPage,
  size,
  onSize,
}: {
  items: ActivityItem[]
  loading: boolean
  section: ActivitySection | null
  onSelect: (section: ActivitySection) => void
  page: number
  /** Общего числа записей нет (журнал растёт), известно только, есть ли следующая страница. */
  hasNext: boolean
  onPage: (page: number) => void
  size: number
  onSize: (size: number) => void
}) {
  const sectionPill = useSlidingPill<HTMLDivElement>(section)

  return (
    <div className="px-6 pb-6 pt-5">
      <div
        ref={sectionPill.navRef}
        className="relative mb-4 flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-full bg-foreground/[0.05] p-1"
      >
        {sectionPill.rect && (
          <span
            aria-hidden
            className="absolute rounded-full bg-gradient-to-br from-nav-active-light via-nav-active to-nav-active-dark shadow-soft-sm"
            style={sectionPill.rect}
          />
        )}
        {ACTIVITY_SECTIONS.map((s) => {
          const Icon = s.icon
          const active = section === s.key
          return (
            <button
              key={s.key}
              type="button"
              ref={sectionPill.setItemRef(s.key)}
              onClick={() => onSelect(s.key)}
              className={`relative z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors duration-300 ${
                active ? 'text-nav-active-ink' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" strokeWidth={1.75} />
              {s.label}
            </button>
          )
        })}
      </div>
      {section == null ? (
        <p className="py-2 text-sm text-muted-foreground">Выберите раздел, чтобы посмотреть историю.</p>
      ) : loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">В этом разделе пока нет записей.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => {
            const Icon = ACTIVITY_ICON[it.kind] ?? FileText
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{it.action}</span>
                    <span className="text-muted-foreground"> · {it.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activityWhen(it.at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {section != null && (items.length > 0 || page > 0) && (
        <>
          {(hasNext || page > 0) && (
            <div className="flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
              <span>На странице:</span>
              {[10, 20, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSize(n)}
                  className={`rounded-md px-2 py-0.5 tabular-nums transition-colors ${
                    size === n
                      ? 'bg-nav-active text-nav-active-ink'
                      : 'hover:bg-nav-active/10 hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          <Pager page={page} hasNext={hasNext} onChange={onPage} />
        </>
      )}
    </div>
  )
}
