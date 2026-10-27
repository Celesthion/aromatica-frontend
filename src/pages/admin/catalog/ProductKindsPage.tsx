import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Droplet, Gift, Lock, Pencil, Plus, Shapes } from 'lucide-react'
import { Badge, Button, Input, Switch, PageLoader, Field, FormDialog } from '@/shared/ui'
import {
  createProductKind,
  fetchProductKinds,
  toggleProductKindArchive,
  updateProductKind,
  type ProductKindInfo,
  type ProductUnit,
  queryKeys,
} from '@/shared/api'
import { UNIT_LABELS } from '@/shared/lib/format'
import { KIND_ICONS, KIND_ICON_NAMES } from '@/shared/lib/kindIcons'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
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

interface KindFormState {
  code: string | null // null при создании
  name: string
  unit: ProductUnit
  giftEligible: boolean
  /** Вид на карточке кассы: имя иконки lucide и HEX акцента. */
  icon: string | null
  color: string | null
  /** У системной формы имя менять нельзя, а иконку, цвет и подарки можно. */
  system: boolean
}

const EMPTY_KIND_FORM: KindFormState = {
  code: null,
  name: '',
  unit: 'PCS',
  giftEligible: true,
  icon: null,
  color: null,
  system: false,
}

const kindToForm = (k: ProductKindInfo): KindFormState => ({
  code: k.code,
  name: k.name,
  unit: k.unit,
  giftEligible: k.giftEligible,
  icon: k.icon,
  color: k.color,
  system: k.system,
})

const KINDS_KEYS = [queryKeys.kinds.all] as const

const DEFAULT_KIND_COLOR = '#8091ad'

const KIND_COLORS = [
  DEFAULT_KIND_COLOR,
  '#9b8ec9',
  '#c39a63',
  '#78a892',
  '#7f8ca4',
  '#c58a6f',
  '#6f9c85',
  '#b0748a',
  '#9aa3b2',
]

export function ProductKindsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState<KindFormState | null>(null)
  const [q, setQ] = useState('')

  const list = useQuery({
    queryKey: queryKeys.kinds.list(showArchived),
    queryFn: () => fetchProductKinds(showArchived),
  })

  const save = useEntityMutation({
    mutationFn: (f: KindFormState) =>
      f.code
        ? updateProductKind(f.code, {
            name: f.name.trim(),
            giftEligible: f.giftEligible,
            icon: f.icon,
            color: f.color,
          })
        : createProductKind({
            name: f.name.trim(),
            unit: f.unit,
            giftEligible: f.giftEligible,
            icon: f.icon,
            color: f.color,
          }),
    invalidate: KINDS_KEYS,
    onDone: () => setForm(null),
  })

  const archive = useEntityMutation({
    mutationFn: toggleProductKindArchive,
    invalidate: KINDS_KEYS,
  })

  const all = list.data ?? []
  const search = q.trim().toLowerCase()
  const rows = search ? all.filter((k) => k.name.toLowerCase().includes(search)) : all
  const perMlCount = all.filter((k) => k.unit === 'ML').length
  const giftCount = all.filter((k) => k.giftEligible).length
  const systemCount = all.filter((k) => k.system).length

  return (
    <ListShell>
      <ListStats>
        <KpiCard label="Всего форм" value={list.data ? String(all.length) : '…'} icon={Shapes} dark />
        <KpiCard
          label="Наливных"
          value={list.data ? String(perMlCount) : '…'}
          sub="продаются по мл"
          icon={Droplet}
          tone="slate"
          dark
        />
        <KpiCard
          label="Участвуют в подарках"
          value={list.data ? String(giftCount) : '…'}
          icon={Gift}
          tone="good"
          dark
        />
        <KpiCard
          label="Системных"
          value={list.data ? String(systemCount) : '…'}
          sub="зашиты в логику"
          icon={Lock}
          tone="warn"
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск формы…"
        filtersCount={showArchived ? 1 : 0}
        filters={<Switch checked={showArchived} onChange={setShowArchived} label="показывать архивные" />}
      >
        <Button onClick={() => setForm({ ...EMPTY_KIND_FORM })}>
          <Plus className="mr-2 h-4 w-4" />
          Новая форма
        </Button>
      </ListToolbar>

      {form && (
        <FormDialog
          title={form.code ? 'Настройка формы' : 'Новая форма'}
          onClose={() => {
            setForm(null)
            save.clearError()
          }}
          onSubmit={() => save.mutate(form)}
          submitLabel={form.code ? 'Сохранить' : 'Создать'}
          busy={save.isPending}
          disabled={!form.name.trim()}
          error={save.error}
        >
          <Field label="Название" hint={form.system ? 'Системная форма — название не меняется' : undefined}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Пробник"
              disabled={form.system}
              autoFocus={!form.system}
            />
          </Field>
          {!form.code && (
            <Field label="Единица" hint="Задаётся при создании: штучный товар или продаваемый по миллилитрам">
              <select
                className="field w-full"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value as ProductUnit })}
              >
                <option value="PCS">Штуки</option>
                <option value="ML">Миллилитры</option>
              </select>
            </Field>
          )}
          <Field label="Подарки" hint="Показывать форму в списке при настройке правил подарков">
            <Switch
              checked={form.giftEligible}
              onChange={(giftEligible) => setForm({ ...form, giftEligible })}
              label={form.giftEligible ? 'участвует в подарках' : 'не участвует'}
            />
          </Field>

          <Field label="Цвет" hint="акцент чипа формы на карточке кассы">
            <div className="flex flex-wrap gap-1.5">
              {KIND_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-foreground/40' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>
          <Field label="Иконка">
            <div className="grid grid-cols-8 gap-1.5">
              {KIND_ICON_NAMES.map((name) => {
                const Icon = KIND_ICONS[name]
                const selected = form.icon === name
                const accent = form.color ?? DEFAULT_KIND_COLOR
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setForm({ ...form, icon: name })}
                    className={`grid h-9 place-items-center rounded-lg border transition ${
                      selected ? 'border-transparent' : 'border-border/60 hover:bg-secondary'
                    }`}
                    style={selected ? { backgroundColor: `${accent}22`, color: accent } : undefined}
                    aria-label={name}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                )
              })}
            </div>
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
                <th className="px-4 py-3 font-medium">Форма</th>
                <th className="px-4 py-3 font-medium">Единица</th>
                <th className="px-4 py-3 font-medium">В подарках</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr
                  key={k.code}
                  className={`border-b border-border/50 last:border-0 ${k.archived ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium" data-label="Форма">
                    {k.name}
                    {k.system && (
                      <Badge variant="outline" className="ml-2 gap-1">
                        <Lock className="h-3 w-3" />
                        системная
                      </Badge>
                    )}
                    {k.archived && (
                      <Badge variant="outline" className="ml-2">
                        архив
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="Единица">
                    {UNIT_LABELS[k.unit]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="В подарках">
                    {k.giftEligible ? 'да' : 'нет'}
                  </td>
                  <td className="px-4 py-3 text-right" data-label="Действия">
                    <div className="inline-flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={k.system ? 'Настроить' : 'Изменить'}
                        onClick={() => {
                          save.clearError()
                          setForm(kindToForm(k))
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!k.system && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title={k.archived ? 'Вернуть из архива' : 'В архив'}
                          onClick={() => archive.mutate(k)}
                        >
                          {k.archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListTable>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shapes className="h-3.5 w-3.5" />
        Системные формы участвуют в логике (вскрытие, касса, цена за мл) и не меняются; свои формы ведут себя
        как обычный товар.
      </p>
    </ListShell>
  )
}
