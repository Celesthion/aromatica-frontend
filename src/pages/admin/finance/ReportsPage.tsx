import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Coins, Receipt, TrendingUp, Users } from 'lucide-react'
import { CARD, Input, PageLoader } from '@/shared/ui'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'
import { fetchReportSummary, queryKeys, type ProductReportRow, type ReportSummary } from '@/shared/api'
import { money } from '@/shared/lib/format'
import { useKindLabels } from '@/entities/kind/useKinds'
import { KpiCard, ListStats } from '@/pages/admin/layout/ListLayout'

const DAY_MS = 86_400_000

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// сегодняшний день и days дней до него
function rangeFor(days: number) {
  const now = Date.now()
  return { from: isoDate(new Date(now - days * DAY_MS)), to: isoDate(new Date(now)) }
}

const PRESETS = [
  { label: 'Сегодня', days: 0 },
  { label: '7 дней', days: 6 },
  { label: '30 дней', days: 29 },
] as const

const DEFAULT_DAYS = PRESETS[2].days

/** Отчёт по продажам: KPI, выручка по дням, топ товаров, продавцы и формы. */
export function ReportsPage() {
  const kindLabel = useKindLabels()
  const [preset, setPreset] = useState<number | null>(DEFAULT_DAYS)
  const [from, setFrom] = useState(() => rangeFor(DEFAULT_DAYS).from)
  const [to, setTo] = useState(() => rangeFor(DEFAULT_DAYS).to)

  const report = useQuery({
    queryKey: queryKeys.report(from, to),
    queryFn: () => fetchReportSummary(from, to),
    enabled: !!from && !!to,
  })

  const summary = report.data

  // у ручных дат пресета нет, подложка прячется
  const periodPill = useSlidingPill<HTMLDivElement>(preset != null ? String(preset) : null)

  const applyPreset = (days: number) => {
    const range = rangeFor(days)
    setPreset(days)
    setFrom(range.from)
    setTo(range.to)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div ref={periodPill.navRef} className="relative inline-flex rounded-full bg-foreground/[0.05] p-1">
          {periodPill.rect && (
            <span
              aria-hidden
              className="absolute rounded-full bg-gradient-to-br from-nav-active-light via-nav-active to-nav-active-dark shadow-soft-sm"
              style={periodPill.rect}
            />
          )}
          {PRESETS.map((p) => {
            const active = preset === p.days
            return (
              <button
                key={p.label}
                type="button"
                ref={periodPill.setItemRef(String(p.days))}
                onClick={() => applyPreset(p.days)}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
                  active ? 'text-nav-active-ink' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPreset(null)
            }}
            className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPreset(null)
            }}
            className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          />
        </div>
      </div>

      <ListStats>
        <KpiCard label="Выручка" value={summary ? money(summary.revenueMinor) : '…'} icon={Banknote} dark />
        <KpiCard label="Чеков" value={summary ? String(summary.salesCount) : '…'} icon={Receipt} dark />
        <KpiCard
          label="Средний чек"
          value={
            summary
              ? money(summary.salesCount ? Math.round(summary.revenueMinor / summary.salesCount) : 0)
              : '…'
          }
          icon={Coins}
          dark
        />
        <KpiCard
          label="Прибыль"
          value={summary ? money(summary.profitMinor) : '…'}
          sub={
            summary && summary.revenueMinor > 0
              ? `маржа ${Math.round((summary.profitMinor / summary.revenueMinor) * 100)}%`
              : undefined
          }
          icon={TrendingUp}
          tone={summary && summary.profitMinor < 0 ? 'bad' : 'good'}
          dark
        />
      </ListStats>

      {report.isLoading ? (
        <PageLoader />
      ) : (
        summary && <ReportCharts summary={summary} kindLabel={kindLabel} />
      )}
    </div>
  )
}

function ReportCharts({
  summary,
  kindLabel,
}: {
  summary: ReportSummary
  kindLabel: (kind: string) => string
}) {
  if (summary.perDay.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-4 py-20 text-center text-muted-foreground ${CARD}`}>
        <TrendingUp className="h-10 w-10" strokeWidth={1.25} />
        <p>Продаж за период нет</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-6`}>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg tracking-tight">Выручка по дням</h2>
          <span className="text-sm text-muted-foreground">
            средняя {money(Math.round(summary.revenueMinor / summary.perDay.length))} / день
          </span>
        </div>
        <DayBars days={summary.perDay} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${CARD} p-6`}>
          <h2 className="mb-4 font-display text-lg tracking-tight">Топ товаров</h2>
          <TopProducts rows={summary.topProducts} />
        </div>

        <div className="space-y-6">
          {summary.perSeller.length > 0 && (
            <div className={`${CARD} p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-green" strokeWidth={1.75} />
                <h2 className="font-display text-lg tracking-tight">По продавцам</h2>
              </div>
              <RankBars
                rows={summary.perSeller.map((s) => ({
                  key: s.login,
                  name: s.displayName ?? s.login,
                  sub: `${s.salesCount} чек.`,
                  value: s.revenueMinor,
                }))}
              />
            </div>
          )}

          {summary.perKind.length > 0 && (
            <div className={`${CARD} p-6`}>
              <h2 className="mb-4 font-display text-lg tracking-tight">По формам выпуска</h2>
              <RankBars
                rows={summary.perKind.map((k) => ({
                  key: k.kind,
                  name: kindLabel(k.kind),
                  sub: `${k.qty} шт · приб. ${money(k.profitMinor)}`,
                  value: k.revenueMinor,
                }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DayBars({
  days,
}: {
  days: { date: string; revenueMinor: number; profitMinor: number; salesCount: number }[]
}) {
  const max = Math.max(1, ...days.map((d) => d.revenueMinor))
  const peakIdx = days.reduce((best, d, i) => (d.revenueMinor > days[best].revenueMinor ? i : best), 0)
  const step = Math.ceil(days.length / 12)
  const weekday = days.length <= 8

  const label = (iso: string) =>
    weekday
      ? new Date(iso).toLocaleDateString('ru-RU', { weekday: 'short' })
      : new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric' })

  return (
    <div>
      <div className="flex h-48 items-stretch gap-1.5">
        {days.map((d, i) => {
          const h = d.revenueMinor > 0 ? Math.max(4, Math.round((d.revenueMinor / max) * 88)) : 2
          const isPeak = i === peakIdx && d.revenueMinor > 0
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              title={`${new Date(d.date).toLocaleDateString('ru-RU')} · выручка ${money(d.revenueMinor)} · прибыль ${money(d.profitMinor)} · ${d.salesCount} чек.`}
            >
              {isPeak && (
                <span className="mb-1.5 whitespace-nowrap rounded-full bg-nav-active px-2 py-0.5 text-[10px] font-medium text-nav-active-ink shadow-[0_2px_8px_-3px_rgba(34,123,99,0.6)]">
                  {money(d.revenueMinor)}
                </span>
              )}
              <div
                className={`w-full max-w-[14px] rounded-full transition-all duration-300 ${
                  isPeak
                    ? 'bg-gradient-to-t from-nav-active-dark to-nav-active-light'
                    : 'bg-foreground/15 group-hover:bg-nav-active/60'
                }`}
                style={{ height: `${h}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {days.map((d, i) => (
          <span key={d.date} className="flex-1 text-center text-[10px] text-muted-foreground">
            {i % step === 0 ? label(d.date) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function TopProducts({ rows }: { rows: ProductReportRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Нет данных</p>
  const max = Math.max(1, ...rows.map((p) => p.revenueMinor))
  return (
    <ul className="space-y-3.5">
      {rows.map((p, i) => (
        <li key={p.productId} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05] text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm">{p.productName}</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">{money(p.revenueMinor)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-nav-active-light to-nav-active"
                style={{ width: `${Math.round((p.revenueMinor / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.qty} · прибыль {money(p.profitMinor)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function RankBars({ rows }: { rows: { key: string; name: string; sub: string; value: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Нет данных</p>
  const max = Math.max(1, ...rows.map((x) => x.value))
  return (
    <ul className="space-y-3.5">
      {rows.map((x) => (
        <li key={x.key}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm">{x.name}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums">{money(x.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className="h-full rounded-full bg-nav-active/70"
              style={{ width: `${Math.round((x.value / max) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{x.sub}</p>
        </li>
      ))}
    </ul>
  )
}
