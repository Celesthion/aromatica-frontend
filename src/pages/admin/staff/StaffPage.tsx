import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ShieldCheck, Store, Users, Warehouse } from 'lucide-react'
import { Badge, Button, Field, PageLoader, SortTh, Switch, useSort } from '@/shared/ui'
import { fetchUsers, fetchWarehouses, queryKeys, type Role } from '@/shared/api'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/entities/staff/roles'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
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
import { StaffCreateDialog } from './StaffCreateDialog'
import { StaffPanel, warehouseNames } from './StaffPanel'

/** Сотрудники: список и панель сотрудника, создание в модалке. */
export function StaffPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | Role>('')
  const [showArchived, setShowArchived] = useState(false)
  const activeFilterCount = (q ? 1 : 0) + (roleFilter ? 1 : 0) + (showArchived ? 1 : 0)

  const { sort, toggle } = useSort({ key: 'login', dir: 'asc' })
  const users = useInfiniteList(queryKeys.users.list(q, roleFilter, showArchived, sort), (page) =>
    fetchUsers(
      page,
      { search: q || undefined, role: roleFilter || undefined, includeArchived: showArchived },
      sort,
    ),
  )
  const warehouses = useQuery({ queryKey: queryKeys.warehouses, queryFn: fetchWarehouses })
  const activeWarehouses = (warehouses.data ?? []).filter((w) => !w.archived)

  // счётчики ролей не зависят от фильтра списка: берём totalItems из поисков размером 1
  const roleCounts = useQuery({
    queryKey: queryKeys.users.roleCounts,
    queryFn: async () => {
      const countRole = async (role: Role) =>
        (await fetchUsers(0, { role, includeArchived: false }, undefined, 1)).totalItems
      const [admins, sellers, seniors] = await Promise.all([
        countRole('ADMIN'),
        countRole('SELLER'),
        countRole('SENIOR_SELLER'),
      ])
      return { admins, sellers: sellers + seniors }
    },
  })
  const rows = users.rows
  const selected = selectedId ? (rows.find((u) => u.id === selectedId) ?? null) : null

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего сотрудников"
          value={users.isLoading ? '…' : String(users.total)}
          sub="по текущему фильтру"
          icon={Users}
          dark
        />
        <KpiCard
          label="Продавцов"
          value={roleCounts.isLoading ? '…' : String(roleCounts.data?.sellers ?? 0)}
          sub="активных"
          icon={Store}
          dark
        />
        <KpiCard
          label="Администраторов"
          value={roleCounts.isLoading ? '…' : String(roleCounts.data?.admins ?? 0)}
          sub="активных"
          icon={ShieldCheck}
          tone="good"
          dark
        />
        <KpiCard
          label="Складов"
          value={warehouses.isLoading ? '…' : String(activeWarehouses.length)}
          sub="активных"
          icon={Warehouse}
          dark
        />
      </ListStats>
      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск по логину или имени…"
        filtersCount={activeFilterCount}
        filters={
          <>
            <Field label="Роль">
              <select
                className="field w-full"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as '' | Role)}
              >
                <option value="">Все роли</option>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Switch checked={showArchived} onChange={setShowArchived} label="показывать архивных" />
          </>
        }
      >
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый сотрудник
        </Button>
      </ListToolbar>

      {creating && <StaffCreateDialog warehouses={activeWarehouses} onClose={() => setCreating(false)} />}

      {users.isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Users className="h-10 w-10" />}>
          {q || activeFilterCount > 0 ? 'Ничего не найдено' : 'Сотрудников нет'}
        </ListEmpty>
      ) : (
        <ListTable ref={users.rootRef} loadingMore={users.isFetchingNextPage}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Логин" sortKey="login" sort={sort} onSort={toggle} />
                <SortTh label="Имя" sortKey="name" sort={sort} onSort={toggle} />
                <SortTh label="Роль" sortKey="role" sort={sort} onSort={toggle} />
                {!selected && <th className="px-4 py-3 font-medium">Склады</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                    selectedId === u.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                  } ${u.archived ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {u.login}
                    {u.archived && (
                      <Badge variant="outline" className="ml-2">
                        архив
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3" data-label="Имя">
                    {u.displayName ?? '—'}
                  </td>
                  <td className="px-4 py-3" data-label="Роль">
                    {ROLE_LABELS[u.role]}
                  </td>
                  {!selected && (
                    <td className="px-4 py-3" data-label="Склады">
                      {u.role === 'ADMIN' ? (
                        <span className="text-muted-foreground">все склады</span>
                      ) : (
                        <span className={u.warehouseIds.length === 0 ? 'text-brand-bad' : ''}>
                          {u.warehouseIds.length === 0
                            ? 'не назначены'
                            : warehouseNames(u.warehouseIds, activeWarehouses)}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </ListTable>
      )}

      <StaffPanel user={selected} warehouses={activeWarehouses} onClose={() => setSelectedId(null)} />
    </ListShell>
  )
}
