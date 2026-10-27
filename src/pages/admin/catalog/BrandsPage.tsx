import { useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Plus, Tags } from 'lucide-react'
import { Badge, Button, Switch, PageLoader, useSort, SortTh } from '@/shared/ui'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { createBrand, fetchBrandsPage, toggleBrandArchive, updateBrand, queryKeys } from '@/shared/api'
import {
  ListShell,
  ListStats,
  KpiCard,
  ListToolbar,
  ListTable,
  ListEmpty,
  TABLE,
  THEAD,
  THEAD_TR,
  rowClass,
} from '@/pages/admin/layout/ListLayout'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import { BrandFormDialog } from './BrandFormDialog'

interface FormState {
  id: string | null
  name: string
}

export function BrandsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [q, setQ] = useState('')
  const [form, setForm] = useState<FormState | null>(null)

  const { sort, toggle } = useSort({ key: 'name', dir: 'asc' })
  const list = useInfiniteList(queryKeys.brands.list(q, showArchived, sort), (page) =>
    fetchBrandsPage(page, q, showArchived, sort),
  )

  const save = useEntityMutation({
    mutationFn: (f: FormState) =>
      f.id ? updateBrand(f.id, { name: f.name.trim() }) : createBrand({ name: f.name.trim() }),
    invalidate: [queryKeys.brands.all],
    onDone: () => setForm(null),
  })

  const archive = useEntityMutation({
    mutationFn: toggleBrandArchive,
    invalidate: [queryKeys.brands.all],
  })

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего брендов"
          value={list.total ? String(list.total) : '…'}
          sub="в справочнике"
          icon={Tags}
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск бренда…"
        filtersCount={showArchived ? 1 : 0}
        filters={<Switch checked={showArchived} onChange={setShowArchived} label="показывать архивные" />}
      >
        <Button onClick={() => setForm({ id: null, name: '' })}>
          <Plus className="mr-2 h-4 w-4" />
          Новый бренд
        </Button>
      </ListToolbar>

      {form && (
        <BrandFormDialog
          title={form.id ? 'Редактирование бренда' : 'Новый бренд'}
          submitLabel={form.id ? 'Сохранить' : 'Создать'}
          name={form.name}
          onNameChange={(name) => setForm({ ...form, name })}
          busy={save.isPending}
          error={save.error}
          onSubmit={() => save.mutate(form)}
          onClose={() => {
            setForm(null)
            save.clearError()
          }}
        />
      )}

      {list.isLoading ? (
        <PageLoader />
      ) : list.rows.length === 0 ? (
        <ListEmpty icon={<Tags className="h-10 w-10" strokeWidth={1.25} />}>
          {q ? 'Ничего не найдено' : 'Брендов нет — создайте первый'}
        </ListEmpty>
      ) : (
        <ListTable ref={list.rootRef}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Бренд" sortKey="name" sort={sort} onSort={toggle} />
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((b) => (
                <tr key={b.id} className={rowClass({ archived: b.archived })}>
                  <td className="px-4 py-3 font-medium" data-label="Бренд">
                    {b.name}
                    {b.archived && (
                      <Badge variant="outline" className="ml-2">
                        архив
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" data-label="Действия">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Изменить"
                        onClick={() => {
                          save.clearError()
                          setForm({ id: b.id, name: b.name })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={b.archived ? 'Вернуть из архива' : 'В архив'}
                        onClick={() => archive.mutate(b)}
                      >
                        {b.archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </ListTable>
      )}
    </ListShell>
  )
}
