import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Truck, UserRound, Users, Wallet } from 'lucide-react'
import { Button, Field, PageLoader, SortTh, useSort } from '@/shared/ui'
import {
  archiveCounterparty,
  createCounterparty,
  fetchDebts,
  searchCounterparties,
  updateCounterparty,
  type Counterparty,
  type CounterpartyType,
  queryKeys,
} from '@/shared/api'
import { money } from '@/shared/lib/format'
import { FastViewPortal } from '@/pages/admin/layout/FastView'
import {
  KpiCard,
  ListEmpty,
  ListShell,
  ListStats,
  ListTable,
  ListToolbar,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'
import { COUNTERPARTY_TYPE_LABELS } from '@/pages/admin/lib/labels'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import {
  CounterpartyCreateDialog,
  EMPTY_COUNTERPARTY,
  type NewCounterparty,
} from './CounterpartyCreateDialog'
import { CounterpartyFastView, type CounterpartyEdit, type CounterpartyPanel } from './CounterpartyFastView'

function useCounterpartyCount(type: CounterpartyType) {
  return useQuery({
    queryKey: queryKeys.counterparties.count(type),
    queryFn: () => searchCounterparties('', type, 0).then((r) => r.totalItems),
  })
}

/** Справочник контрагентов: список и фаст-вью, создание в модалке. */
export function CounterpartiesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState<'' | CounterpartyType>('')
  const [q, setQ] = useState('')
  const activeFilterCount = typeFilter ? 1 : 0

  const { sort, toggle } = useSort({ key: 'name', dir: 'asc' })
  const list = useInfiniteList(queryKeys.counterparties.list(q, typeFilter, sort), (page) =>
    searchCounterparties(q, typeFilter || undefined, page, sort),
  )
  const rows = list.rows
  const selected = selectedId ? (rows.find((c) => c.id === selectedId) ?? null) : null

  const supplierCount = useCounterpartyCount('SUPPLIER')
  const customerCount = useCounterpartyCount('CUSTOMER')
  const debts = useQuery({ queryKey: queryKeys.debts, queryFn: fetchDebts })
  const totalDebt = (debts.data ?? []).reduce((sum, r) => sum + r.debtMinor, 0)

  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<NewCounterparty>(EMPTY_COUNTERPARTY)

  const [panel, setPanel] = useState<CounterpartyPanel>('info')
  const [edit, setEdit] = useState<CounterpartyEdit>({
    name: '',
    type: 'SUPPLIER',
    phone: '',
    gender: '',
    birthDate: '',
    note: '',
  })

  useEffect(() => {
    setPanel('info')
  }, [selectedId])

  const create = useEntityMutation({
    mutationFn: () =>
      createCounterparty({
        name: draft.name,
        type: draft.type,
        phone: draft.phone,
        gender: draft.gender || null,
        birthDate: draft.birthDate || null,
      }),
    invalidate: [queryKeys.counterparties.all],
    onDone: () => {
      setDraft(EMPTY_COUNTERPARTY)
      setCreating(false)
    },
  })

  const saveEdit = useEntityMutation({
    mutationFn: () =>
      updateCounterparty(selected!.id, {
        name: edit.name,
        type: edit.type,
        phone: edit.phone,
        gender: edit.gender || null,
        birthDate: edit.birthDate || null,
        note: edit.note || null,
      }),
    invalidate: [queryKeys.counterparties.all],
    onDone: () => setPanel('info'),
  })

  const archive = useEntityMutation({
    mutationFn: () => archiveCounterparty(selected!.id),
    invalidate: [queryKeys.counterparties.all],
    onDone: () => setSelectedId(null),
  })

  const enterEdit = (c: Counterparty) => {
    setEdit({
      name: c.name,
      type: c.type,
      phone: c.phone ?? '',
      gender: c.gender ?? '',
      birthDate: c.birthDate ?? '',
      note: c.note ?? '',
    })
    saveEdit.clearError()
    setPanel('edit')
  }

  const enterArchive = () => {
    archive.clearError()
    setPanel('archive')
  }

  return (
    <ListShell>
      <ListStats>
        <KpiCard label="Всего контрагентов" value={list.total ? String(list.total) : '…'} icon={Users} dark />
        <KpiCard
          label="Поставщиков"
          value={supplierCount.data != null ? String(supplierCount.data) : '…'}
          sub="приёмки и возвраты"
          icon={Truck}
          dark
        />
        <KpiCard
          label="Покупателей"
          value={customerCount.data != null ? String(customerCount.data) : '…'}
          sub="продажи и возвраты"
          icon={UserRound}
          dark
        />
        <KpiCard
          label="Долг поставщикам"
          value={debts.data != null ? money(totalDebt) : '…'}
          sub="неоплаченные приёмки"
          icon={Wallet}
          tone="bad"
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск по названию или телефону…"
        filtersCount={activeFilterCount}
        filters={
          <Field label="Тип">
            <select
              className="field w-full"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as '' | CounterpartyType)}
            >
              <option value="">Все</option>
              <option value="SUPPLIER">Поставщики</option>
              <option value="CUSTOMER">Покупатели</option>
            </select>
          </Field>
        }
      >
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый контрагент
        </Button>
      </ListToolbar>

      {creating && (
        <CounterpartyCreateDialog
          value={draft}
          onPatch={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          busy={create.isPending}
          onSubmit={() => create.mutate()}
          onClose={() => setCreating(false)}
        />
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Users className="h-10 w-10" />}>
          {q || activeFilterCount > 0 ? 'Ничего не найдено' : 'Контрагентов ещё нет'}
        </ListEmpty>
      ) : (
        <ListTable ref={list.rootRef}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Название" sortKey="name" sort={sort} onSort={toggle} />
                <SortTh label="Тип" sortKey="type" sort={sort} onSort={toggle} />
                {!selected && <SortTh label="Телефон" sortKey="phone" sort={sort} onSort={toggle} />}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                    selectedId === c.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="Тип">
                    {COUNTERPARTY_TYPE_LABELS[c.type]}
                  </td>
                  {!selected && (
                    <td className="px-4 py-3 text-muted-foreground" data-label="Телефон">
                      {c.phone ?? '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </ListTable>
      )}

      <FastViewPortal open={selected != null}>
        {selected && (
          <CounterpartyFastView
            counterparty={selected}
            panel={panel}
            onPanel={setPanel}
            onEdit={() => enterEdit(selected)}
            onArchive={enterArchive}
            onClose={() => setSelectedId(null)}
            edit={edit}
            onEditChange={setEdit}
            save={saveEdit}
            archive={archive}
          />
        )}
      </FastViewPortal>
    </ListShell>
  )
}
