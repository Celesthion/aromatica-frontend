import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Plus, Users, Wallet, Warehouse } from 'lucide-react'
import { Badge, Button, Field, FormDialog, Input, PageLoader, SortTh, sortRows, useSort } from '@/shared/ui'
import {
  archiveWarehouse,
  createWarehouse,
  fetchStockSummary,
  fetchUsers,
  fetchWarehouses,
  makeWarehouseDefault,
  updateWarehouse,
  type WarehouseInfo,
  queryKeys,
} from '@/shared/api'
import { money } from '@/shared/lib/format'
import { FastViewPortal } from '@/pages/admin/layout/FastView'
import {
  KpiCard,
  ListShell,
  ListStats,
  ListTable,
  ListToolbar,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { WarehouseFastView, type WarehouseEdit, type WarehousePanel } from './WarehouseFastView'

const WAREHOUSE_KEYS = [queryKeys.warehouses, queryKeys.stock.all] as const

// закреплённых за складами сотрудников берём одной страницей
const USERS_PAGE_SIZE = 200

/** Справочник складов: адрес, стоимость остатков и закреплённые сотрудники. */
export function WarehousesPage() {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<WarehousePanel>('info')
  const [edit, setEdit] = useState<WarehouseEdit>({ name: '', address: '' })
  const [q, setQ] = useState('')

  const list = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  })

  const summary = useQuery({
    queryKey: queryKeys.stock.summary(''),
    queryFn: () => fetchStockSummary(),
  })

  const users = useQuery({
    queryKey: queryKeys.users.warehouseAssignees,
    queryFn: () => fetchUsers(0, {}, undefined, USERS_PAGE_SIZE).then((r) => r.items),
  })

  const selected = selectedId ? ((list.data ?? []).find((w) => w.id === selectedId) ?? null) : null
  const { sort, toggle } = useSort({ key: 'name', dir: 'asc' })
  const rows = sortRows(list.data ?? [], sort, {
    name: (w) => w.name,
    address: (w) => w.address,
    default: (w) => w.isDefault,
  })
  const assignees = (users.data ?? []).filter(
    (u) => u.role !== 'ADMIN' && u.warehouseIds.includes(selectedId ?? ''),
  )
  const staffCount = (users.data ?? []).filter((u) => u.role !== 'ADMIN' && u.warehouseIds.length > 0).length
  const search = q.trim().toLowerCase()
  const shown = search
    ? rows.filter(
        (w) => w.name.toLowerCase().includes(search) || (w.address ?? '').toLowerCase().includes(search),
      )
    : rows

  useEffect(() => setPanel('info'), [selectedId])

  const stockValue = useQuery({
    queryKey: queryKeys.stock.summary(selectedId),
    enabled: selected != null,
    queryFn: () => fetchStockSummary(selected!.id),
  })

  const create = useEntityMutation({
    mutationFn: () => createWarehouse(name.trim(), address.trim() || null),
    invalidate: WAREHOUSE_KEYS,
    onDone: () => {
      setName('')
      setAddress('')
      setCreating(false)
    },
  })

  const saveEdit = useEntityMutation({
    mutationFn: () => updateWarehouse(selected!.id, { name: edit.name, address: edit.address || null }),
    invalidate: WAREHOUSE_KEYS,
    onDone: () => setPanel('info'),
  })

  const makeDefault = useEntityMutation({
    mutationFn: makeWarehouseDefault,
    invalidate: WAREHOUSE_KEYS,
    onDone: () => setPanel('info'),
  })

  const archive = useEntityMutation({
    mutationFn: archiveWarehouse,
    invalidate: WAREHOUSE_KEYS,
    onDone: () => setSelectedId(null),
  })

  const openEdit = (w: WarehouseInfo) => {
    setEdit({ name: w.name, address: w.address ?? '' })
    saveEdit.clearError()
    setPanel('edit')
  }

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего складов"
          value={list.data ? String(list.data.length) : '…'}
          icon={Warehouse}
          dark
        />
        <KpiCard
          label="Позиций на остатке"
          value={summary.data ? String(summary.data.onHand) : '…'}
          sub="товаров с остатком"
          icon={Boxes}
          tone="slate"
          dark
        />
        <KpiCard
          label="Сотрудников на складах"
          value={users.data ? String(staffCount) : '…'}
          sub="кроме админов"
          icon={Users}
          tone="warn"
          dark
        />
        <KpiCard
          label="Стоимость остатков"
          value={summary.data ? money(summary.data.totalValueMinor) : '…'}
          sub="по всем складам"
          icon={Wallet}
          tone="good"
          dark
        />
      </ListStats>

      <ListToolbar onSearch={setQ} placeholder="Поиск склада…">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый склад
        </Button>
      </ListToolbar>

      {creating && (
        <FormDialog
          title="Новый склад"
          onClose={() => setCreating(false)}
          onSubmit={() => create.mutate()}
          busy={create.isPending}
          disabled={!name.trim()}
          error={create.error}
        >
          <Field label="Название">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Магазин (точка)"
              autoFocus
            />
          </Field>
          <Field label="Адрес">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Необязательно — город, улица, дом"
            />
          </Field>
        </FormDialog>
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : (
        <ListTable>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Название" sortKey="name" sort={sort} onSort={toggle} />
                <SortTh label="Адрес" sortKey="address" sort={sort} onSort={toggle} />
                <SortTh label="По умолчанию" sortKey="default" sort={sort} onSort={toggle} />
              </tr>
            </thead>
            <tbody>
              {shown.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                    selectedId === w.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      {w.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="Адрес">
                    {w.address ?? '—'}
                  </td>
                  <td className="px-4 py-3" data-label="По умолчанию">
                    {w.isDefault && <Badge>по умолчанию</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListTable>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Товар между складами перемещается только документом «Перемещение» — себестоимость едет вместе с
        товаром.
      </p>

      <FastViewPortal open={selected != null}>
        {selected && (
          <WarehouseFastView
            warehouse={selected}
            panel={panel}
            onPanel={setPanel}
            onEdit={() => openEdit(selected)}
            onClose={() => setSelectedId(null)}
            stockValueMinor={stockValue.data?.totalValueMinor}
            assignees={assignees}
            assigneesLoading={users.isLoading}
            edit={edit}
            onEditChange={setEdit}
            save={saveEdit}
            makeDefault={makeDefault}
            archive={archive}
          />
        )}
      </FastViewPortal>
    </ListShell>
  )
}
