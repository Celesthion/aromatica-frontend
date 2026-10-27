import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Package, ShoppingCart, Star, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { CARD } from '@/shared/ui'
import {
  fetchCurrentShift,
  fetchMoneyAccounts,
  fetchReportSummary,
  fetchStockSummary,
  queryKeys,
} from '@/shared/api'
import { money, toIsoDate } from '@/shared/lib/format'
import { CARD_DARK, HubCardHeader } from './HubCardHeader'
import { TasksCard } from './TasksCard'

const HOUR_MS = 3_600_000
// кольцо смены заполняется от условной 8-часовой смены
const SHIFT_MS = 8 * HOUR_MS
const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const pad = (n: number) => String(n).padStart(2, '0')

/** Главная: метрики, выручка, продавец месяца, смена, счета, задачи. */
export function ModuleHubPage() {
  const now = new Date()
  const today = toIsoDate(now)
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`

  const monthQuery = useQuery({
    queryKey: queryKeys.report(monthStart, today),
    queryFn: () => fetchReportSummary(monthStart, today),
  })
  const todayQuery = useQuery({
    queryKey: queryKeys.report(today, today),
    queryFn: () => fetchReportSummary(today, today),
  })
  const stock = useQuery({ queryKey: queryKeys.stock.summary(''), queryFn: () => fetchStockSummary() })
  const accounts = useQuery({ queryKey: queryKeys.moneyAccounts, queryFn: fetchMoneyAccounts })
  const shift = useQuery({ queryKey: queryKeys.pos.currentShift, queryFn: fetchCurrentShift })

  const monthReport = monthQuery.data
  const todayReport = todayQuery.data
  const margin =
    monthReport && monthReport.revenueMinor > 0
      ? Math.round((monthReport.profitMinor / monthReport.revenueMinor) * 100)
      : 0
  const avgCheck =
    todayReport && todayReport.salesCount > 0
      ? Math.round(todayReport.revenueMinor / todayReport.salesCount)
      : 0

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid shrink-0 gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div className="flex flex-wrap items-end gap-x-7 gap-y-4">
          <Metric label="Выручка за сегодня">
            <span className="flex h-9 items-center rounded-full bg-primary px-4 text-[13.5px] text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              {todayReport ? money(todayReport.revenueMinor) : '…'}
            </span>
          </Metric>
          <Metric label="Средний чек">
            <span className="flex h-9 items-center rounded-full bg-brand-slate px-4 text-[13.5px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              {avgCheck ? money(avgCheck) : '—'}
            </span>
          </Metric>
          <Metric label="Маржа за месяц" className="min-w-[230px] flex-1">
            <div className="relative flex h-9 items-center overflow-hidden rounded-full bg-secondary px-4 text-[13.5px] text-muted-foreground shadow-[inset_0_1px_3px_rgba(70,80,100,0.12)]">
              <span
                className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, margin))}%`,
                  backgroundImage:
                    'repeating-linear-gradient(115deg,hsl(var(--primary) / .20) 0 12px,hsl(var(--primary) / .32) 12px 24px)',
                }}
              />
              <span className="relative">{monthReport ? `${margin}%` : '…'}</span>
            </div>
          </Metric>
          <Metric label="Чеков сегодня">
            <span className="flex h-9 min-w-[92px] items-center justify-center rounded-full border border-dashed border-muted-foreground/40 px-4 text-[13.5px] text-muted-foreground">
              {todayReport ? todayReport.salesCount : '…'}
            </span>
          </Metric>
        </div>

        <div className="flex justify-start gap-8 lg:justify-end">
          <Stat icon={Package} value={stock.data ? String(stock.data.positions) : '…'} caption="Товаров" />
          <Stat
            icon={ShoppingCart}
            value={todayReport ? String(todayReport.salesCount) : '…'}
            caption="Продажи"
          />
          <Stat
            icon={TrendingUp}
            value={monthReport ? money(monthReport.profitMinor) : '…'}
            caption="Прибыль (мес.)"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:auto-rows-fr lg:grid-cols-4">
        <SellerOfMonth
          seller={
            monthReport && monthReport.perSeller.length > 0
              ? [...monthReport.perSeller].sort((a, b) => b.revenueMinor - a.revenueMinor)[0]
              : null
          }
        />
        <RevenueCard perDay={monthReport?.perDay ?? []} endIso={today} ready={!!monthReport} />
        <TasksCard />
        <ShiftCard shift={shift.data ?? null} loading={shift.isLoading} />
        <AccountsCard accounts={accounts.data ?? []} loading={accounts.isLoading} />
      </div>
    </div>
  )
}

function Metric({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      {/* фиксированная высота подписи держит значения на одной линии */}
      <div className="mb-2 h-4 text-[13px] leading-4 text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

function Stat({ icon: Icon, value, caption }: { icon: LucideIcon; value: string; caption: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-7 w-7 text-brand-slate" strokeWidth={1.5} />
      <div>
        <div className="text-3xl font-light leading-none tracking-tight tabular-nums">{value}</div>
        <div className="mt-1.5 text-[13px] text-muted-foreground">{caption}</div>
      </div>
    </div>
  )
}

function SellerOfMonth({
  seller,
}: {
  seller: { displayName: string | null; login: string; revenueMinor: number; salesCount: number } | null
}) {
  const name = seller?.displayName ?? seller?.login ?? '—'
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className={`relative flex min-h-[196px] flex-col justify-between overflow-hidden p-5 ${CARD_DARK}`}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(154,166,188,0.5),transparent_70%)]" />
      <div className="relative flex items-start justify-between">
        <div className="grid h-[68px] w-[68px] place-items-center rounded-[20px] bg-gradient-to-br from-tint-steel to-brand-slate-deep text-2xl font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          {initials || '—'}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/[0.16] px-3 py-1.5 text-xs backdrop-blur">
          <Star className="h-3.5 w-3.5" /> Продавец месяца
        </span>
      </div>
      <div className="relative">
        <div className="text-2xl font-normal">{name}</div>
        <div className="mt-0.5 text-[13px] text-white/60">
          {seller ? `${seller.salesCount} чек.` : 'нет продаж за месяц'}
        </div>
      </div>
      {seller && (
        <div className="absolute bottom-5 right-5 rounded-full bg-brand-graphite-ink px-4 py-2.5 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          {money(seller.revenueMinor)}
        </div>
      )}
    </div>
  )
}

function RevenueCard({
  perDay,
  endIso,
  ready,
}: {
  perDay: { date: string; revenueMinor: number }[]
  endIso: string
  ready: boolean
}) {
  const byDate = new Map(perDay.map((d) => [d.date, d.revenueMinor]))
  const end = new Date(`${endIso}T00:00:00`)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end)
    d.setDate(end.getDate() - (6 - i))
    const iso = toIsoDate(d)
    return { date: iso, revenueMinor: byDate.get(iso) ?? 0 }
  })
  const weekRevenue = days.reduce((s, d) => s + d.revenueMinor, 0)
  const max = Math.max(1, ...days.map((d) => d.revenueMinor))
  return (
    <div className={`${CARD} p-5 lg:col-span-2`}>
      <HubCardHeader title="Выручка" to="/admin/reports" icon={TrendingUp} />
      <div>
        <span className="text-3xl font-light tracking-tight tabular-nums">
          {ready ? money(weekRevenue) : '…'}
        </span>
        <span className="ml-2.5 text-[13px] text-muted-foreground">за неделю</span>
      </div>
      <div className="mt-4 flex h-[150px] items-end gap-3">
        {days.map((d) => {
          const h = Math.round((d.revenueMinor / max) * 100)
          const weekday = WEEKDAYS_SHORT[new Date(`${d.date}T00:00:00`).getDay()]
          const isMax = d.revenueMinor === max && d.revenueMinor > 0
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className={`w-3 rounded-lg ${isMax ? 'bg-primary' : 'bg-brand-slate-fog'}`}
                style={{ height: `${d.revenueMinor > 0 ? Math.max(h, 4) : 2}%` }}
                title={money(d.revenueMinor)}
              />
              <div
                className={`h-1.5 w-1.5 rounded-full ${isMax ? 'bg-primary/60' : 'bg-brand-slate-pale'}`}
              />
              <div className="text-xs text-muted-foreground/70">{weekday}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShiftCard({
  shift,
  loading,
}: {
  shift: { number: number; openedAt: string; warehouseName: string | null } | null
  loading: boolean
}) {
  const elapsed = shift ? Date.now() - new Date(shift.openedAt).getTime() : 0
  const hh = Math.floor(elapsed / HOUR_MS)
  const mm = Math.floor((elapsed % HOUR_MS) / 60_000)
  const frac = shift ? Math.min(1, elapsed / SHIFT_MS) : 0
  const R = 70
  const C = 2 * Math.PI * R
  return (
    <div className={`${CARD} flex flex-col p-5`}>
      <HubCardHeader title="Смена" to="/admin/pos" icon={Clock} />
      <div className="relative mx-auto my-1 h-[140px] w-[140px]">
        <svg width="140" height="140" viewBox="0 0 172 172" className="-rotate-90">
          <circle cx="86" cy="86" r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
          <circle
            cx="86"
            cy="86"
            r={R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          {loading ? (
            <div className="text-sm text-muted-foreground">…</div>
          ) : shift ? (
            <>
              <div className="text-3xl font-light tabular-nums">
                {pad(hh)}:{pad(mm)}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">Смена №{shift.number}</div>
            </>
          ) : (
            <div className="px-4 text-sm text-muted-foreground">Касса закрыта</div>
          )}
        </div>
      </div>
      <div className="mt-1 text-center text-[13px] text-muted-foreground">
        {shift ? (shift.warehouseName ?? 'В работе') : 'Смена не открыта'}
      </div>
    </div>
  )
}

function AccountsCard({
  accounts,
  loading,
}: {
  accounts: { id: string; name: string; balanceMinor: number }[]
  loading: boolean
}) {
  const total = accounts.reduce((s, a) => s + a.balanceMinor, 0)
  return (
    <div className={`${CARD} p-5 lg:col-span-2`}>
      <HubCardHeader title="Счета" to="/admin/money" icon={Wallet} />
      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">…</p>
      ) : accounts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Счетов нет</p>
      ) : (
        <div className="divide-y divide-border">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-muted-foreground">{a.name}</span>
              <span className={`tabular-nums ${a.balanceMinor < 0 ? 'text-destructive' : ''}`}>
                {money(a.balanceMinor)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-sm font-medium">
            <span>Всего</span>
            <span className="tabular-nums">{money(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
