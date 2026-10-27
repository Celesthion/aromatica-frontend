import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ban, Ticket, Wallet } from 'lucide-react'
import { Button, Field, FormDialog, Input, Modal, PageLoader, SearchInput } from '@/shared/ui'
import { formatGiftCode } from '@/shared/lib/giftCode'
import { somToMinorOr0 } from '@/shared/lib/money'
import { money } from '@/shared/lib/format'
import {
  blockGiftCertificate,
  fetchGiftHistory,
  fetchGiftStats,
  generateGiftBatch,
  searchGiftCertificates,
  type GiftCertificate,
  type GiftStatus,
  queryKeys,
} from '@/shared/api'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import {
  KpiCard,
  ListEmpty,
  ListShell,
  ListStats,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'

const MAX_BATCH = 1000

const STATUS_LABELS: Record<GiftStatus, string> = {
  NEW: 'Не продан',
  ACTIVE: 'В обращении',
  USED: 'Потрачен',
  BLOCKED: 'Заблокирован',
}

const STATUS_TONE: Record<GiftStatus, string> = {
  NEW: 'bg-foreground/[0.06] text-foreground/70',
  ACTIVE: 'text-brand-good bg-brand-good/12',
  USED: 'bg-foreground/[0.06] text-muted-foreground',
  BLOCKED: 'text-destructive bg-destructive/10',
}

/** Сертификаты: выпуск пачек бланков и контроль обязательств; продают и гасят их на кассе. */
export function GiftCertificatesPage() {
  const [q, setQ] = useState('')
  const [batchOpen, setBatchOpen] = useState(false)
  // коды генерирует сервер, здесь только количество и номинал
  const [count, setCount] = useState('50')
  const [nominal, setNominal] = useState('')
  const [generated, setGenerated] = useState<GiftCertificate[] | null>(null)
  const [historyOf, setHistoryOf] = useState<GiftCertificate | null>(null)

  const [statusFilter, setStatusFilter] = useState<GiftStatus | ''>('')

  // ищем на сервере по коду и по покупателю: при потере бланка обычно знают, кто его купил
  const list = useInfiniteList(queryKeys.giftCertificates.list(q, statusFilter), (page) =>
    searchGiftCertificates(q, statusFilter || undefined, page),
  )
  const rows = list.rows
  // сводку считает сервер по всему реестру
  const stats = useQuery({ queryKey: queryKeys.giftCertificates.stats, queryFn: fetchGiftStats })

  const nominalMinor = somToMinorOr0(nominal)

  const parsedCount = Math.trunc(Number(count))
  const generateBatch = useEntityMutation({
    mutationFn: () => generateGiftBatch({ count: parsedCount, nominalMinor }),
    invalidate: [queryKeys.giftCertificates.all],
    onDone: (result: GiftCertificate[]) => {
      setNominal('')
      setBatchOpen(false)
      setGenerated(result)
    },
  })

  const block = useEntityMutation({
    mutationFn: (c: GiftCertificate) => blockGiftCertificate(c.id, 'Заблокирован из админки'),
    invalidate: [queryKeys.giftCertificates.all],
  })

  const history = useQuery({
    queryKey: queryKeys.giftCertificates.history(historyOf?.id),
    queryFn: () => fetchGiftHistory(historyOf!.id),
    enabled: historyOf != null,
  })

  return (
    <ListShell>
      <ListStats columns={3}>
        <KpiCard
          label="Обязательства"
          value={money(stats.data?.liabilityMinor ?? 0)}
          sub="непогашенные остатки"
          icon={Wallet}
          dark
        />
        <KpiCard
          label="Бланков не продано"
          value={String(stats.data?.inStock ?? 0)}
          sub="лежат в запасе"
          icon={Ticket}
          dark
        />
        <KpiCard
          label="Всего бланков"
          value={String(stats.data?.total ?? 0)}
          sub="за всё время"
          icon={Ticket}
          tone="good"
          dark
        />
      </ListStats>

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2.5">
        <Button onClick={() => setBatchOpen(true)}>
          <Ticket className="mr-2 h-4 w-4" />
          Завезти пачку
        </Button>
        <SearchInput
          onSearch={setQ}
          placeholder="Код, имя или телефон покупателя…"
          className="min-w-[12rem] flex-1"
          inputClassName="h-11"
        />
        <select
          className="field h-11"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GiftStatus | '')}
          aria-label="Статус"
        >
          <option value="">Все статусы</option>
          {(Object.keys(STATUS_LABELS) as GiftStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {batchOpen && (
        <FormDialog
          title="Новая пачка бланков"
          onClose={() => setBatchOpen(false)}
          onSubmit={() => generateBatch.mutate()}
          submitLabel="Сгенерировать"
          busy={generateBatch.isPending}
          disabled={nominalMinor <= 0 || !(parsedCount >= 1 && parsedCount <= MAX_BATCH)}
          error={generateBatch.error}
        >
          <Field label="Сколько бланков">
            <Input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="50"
              autoFocus
            />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">
            До 1000 за раз. Код — 12 цифр с контрольной, как у банковской карты; печатать будем по этим кодам,
            группами по четыре.
          </p>
          <Field label="Номинал, с">
            <Input
              inputMode="decimal"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="5000"
            />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">
            Номинал печатается на бланке, поэтому у всей пачки он общий. Пачки с разным номиналом генерируйте
            отдельно.
          </p>
        </FormDialog>
      )}

      {generated && (
        <Modal
          title={`Сгенерировано: ${generated.length} · ${money(generated[0]?.nominalMinor ?? 0)}`}
          onClose={() => setGenerated(null)}
          maxWidth="max-w-md"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Бланки заведены со статусом «не продан». Коды всегда есть в реестре — эти же пойдут на печать.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-glass-line bg-glass-strong p-3 font-mono text-sm leading-7">
            {generated.map((c) => (
              <div key={c.id}>{formatGiftCode(c.code)}</div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard.writeText(generated.map((c) => formatGiftCode(c.code)).join('\n'))
              }
            >
              Скопировать коды
            </Button>
            <Button onClick={() => setGenerated(null)}>Готово</Button>
          </div>
        </Modal>
      )}

      {historyOf && (
        <Modal
          title={`История · ${formatGiftCode(historyOf.code)}`}
          onClose={() => setHistoryOf(null)}
          maxWidth="max-w-md"
        >
          {history.isLoading && <PageLoader />}
          {history.data?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Движений ещё не было</p>
          )}
          <div className="space-y-1">
            {(history.data ?? []).map((u, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {u.amountMinor < 0 ? 'Погашение' : 'Возврат на сертификат'}
                </span>
                <span className={`font-semibold tabular-nums ${u.amountMinor < 0 ? '' : 'text-brand-good'}`}>
                  {u.amountMinor < 0 ? '−' : '+'}
                  {money(Math.abs(u.amountMinor))}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Ticket className="h-10 w-10" />}>
          {q || statusFilter ? 'Ничего не найдено' : 'Бланков ещё нет — завезите пачку'}
        </ListEmpty>
      ) : (
        <div
          ref={list.rootRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-glass-line bg-glass-strong backdrop-blur-xl backdrop-saturate-150"
        >
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Покупатель</th>
                <th className="px-4 py-3 text-right">Номинал</th>
                <th className="px-4 py-3 text-right">Остаток</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 font-medium tabular-nums">{formatGiftCode(c.code)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.buyerName ? (
                      <span className="block">
                        <span className="block truncate">{c.buyerName}</span>
                        <span className="block text-xs text-muted-foreground">{c.buyerPhone}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(c.nominalMinor)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {c.status === 'NEW' ? '—' : money(c.balanceMinor)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setHistoryOf(c)}>
                        История
                      </Button>
                      {c.status !== 'BLOCKED' && c.status !== 'USED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Бланк потерян или испорчен"
                          onClick={() => block.mutate(c)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </div>
      )}
    </ListShell>
  )
}
