import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gift, Pause, Pencil, Plus, Power, Shapes, Trash2 } from 'lucide-react'
import { Badge, Button, PageLoader } from '@/shared/ui'
import {
  createGiftRule,
  deleteGiftRule,
  fetchGiftRules,
  fetchProductKinds,
  toggleGiftRule,
  updateGiftRule,
  type GiftCondition,
  type GiftItem,
  type GiftRule,
  queryKeys,
} from '@/shared/api'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
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
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { GiftRuleDialog } from './GiftRuleDialog'
import { emptyGiftRuleForm, giftRuleToRequest, ruleToForm, type GiftRuleFormState } from './giftRuleForm'

const RULE_KEYS = [queryKeys.giftRules.all] as const

const itemText = (it: GiftItem): string => {
  const unit = UNIT_LABELS[it.unit ?? 'PCS']
  return it.productId != null
    ? `${it.productName ?? it.productId} ×${qtyFmt(it.qty)} ${unit}`
    : `любой «${it.kindName ?? it.kind}» ×${qtyFmt(it.qty)} ${unit}`
}

const itemsText = (r: GiftRule) => r.items.map(itemText).join(' + ')

function conditionText(c: GiftCondition, kindName: (code: string) => string): string {
  if (c.type === 'SUM') return `чек от ${money(c.minSumMinor ?? 0)}`
  if (c.type === 'PRODUCT') return `куплен «${c.productName ?? c.productId}»`
  if (c.type === 'KIND')
    return `${kindName(c.kind ?? '')}${c.minVolumeMl != null ? ` от ${c.minVolumeMl} мл` : ''}`
  return ''
}

// группы в скобках, если их больше одной
function conditionsText(r: GiftRule, kindName: (code: string) => string) {
  const groups = [...new Set(r.conditions.map((c) => c.group ?? 0))].sort((a, b) => a - b)
  const parts = groups.map((g) =>
    r.conditions
      .filter((c) => (c.group ?? 0) === g)
      .map((c) => conditionText(c, kindName))
      .join(' И '),
  )
  return parts.length > 1 ? parts.map((p) => `(${p})`).join(' ИЛИ ') : parts[0]
}

/** Правила подарков: условия (сумма, форма, товар) и набор подарка. */
export function GiftRulesPage() {
  const [form, setForm] = useState<GiftRuleFormState | null>(null)
  const [q, setQ] = useState('')
  // формы вместе с архивными: форма в условии могла попасть в архив после создания
  const kinds = useQuery({
    queryKey: queryKeys.kinds.withArchived,
    queryFn: () => fetchProductKinds(true),
    staleTime: 5 * 60_000,
  })
  const allKinds = kinds.data ?? []
  const kindByCode = new Map(allKinds.map((k) => [k.code, k]))
  const kindName = (code: string) => kindByCode.get(code)?.name ?? code
  const activeKinds = allKinds.filter((k) => !k.archived).map((k) => ({ code: k.code, name: k.name }))
  const giftKinds = allKinds
    .filter((k) => !k.archived && k.giftEligible !== false)
    .map((k) => ({ code: k.code, name: k.name, unit: k.unit }))

  const list = useQuery({ queryKey: queryKeys.giftRules.all, queryFn: fetchGiftRules })

  const save = useEntityMutation({
    mutationFn: (f: GiftRuleFormState) => {
      const data = giftRuleToRequest(f)
      return f.id ? updateGiftRule(f.id, data) : createGiftRule(data)
    },
    invalidate: RULE_KEYS,
    onDone: () => setForm(null),
  })

  const toggle = useEntityMutation({ mutationFn: toggleGiftRule, invalidate: RULE_KEYS })
  const remove = useEntityMutation({ mutationFn: deleteGiftRule, invalidate: RULE_KEYS })

  const all = list.data ?? []
  const search = q.trim().toLowerCase()
  const rows = search ? all.filter((r) => r.name.toLowerCase().includes(search)) : all
  const activeCount = all.filter((r) => r.active).length

  return (
    <ListShell>
      <ListStats>
        <KpiCard label="Всего правил" value={list.data ? String(all.length) : '…'} icon={Gift} dark />
        <KpiCard
          label="Активных"
          value={list.data ? String(activeCount) : '…'}
          sub="работают на кассе"
          icon={Power}
          tone="good"
          dark
        />
        <KpiCard
          label="Выключенных"
          value={list.data ? String(all.length - activeCount) : '…'}
          icon={Pause}
          tone="slate"
          dark
        />
        <KpiCard
          label="Форм в подарках"
          value={kinds.data ? String(giftKinds.length) : '…'}
          sub="доступны для набора"
          icon={Shapes}
          tone="warn"
          dark
        />
      </ListStats>

      <ListToolbar onSearch={setQ} placeholder="Поиск правила…">
        <Button onClick={() => setForm(emptyGiftRuleForm())}>
          <Plus className="mr-2 h-4 w-4" />
          Новое правило
        </Button>
      </ListToolbar>

      {form && (
        <GiftRuleDialog
          form={form}
          setForm={setForm}
          giftKinds={giftKinds}
          activeKinds={activeKinds}
          kindName={kindName}
          isArchivedKind={(code) => !!kindByCode.get(code)?.archived}
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
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<Gift className="h-10 w-10" strokeWidth={1.25} />}>
          Правил пока нет — опишите первую акцию
        </ListEmpty>
      ) : (
        <ListTable>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Когда</th>
                <th className="px-4 py-3 font-medium">Подарок</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-border/50 last:border-0 ${r.active ? '' : 'opacity-50'}`}
                >
                  <td className="px-4 py-3 font-medium" data-label="Название">
                    {r.name}
                    {!r.active && (
                      <Badge variant="outline" className="ml-2">
                        выключено
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="Когда">
                    {conditionsText(r, kindName)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-label="Подарок">
                    {itemsText(r)}
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
                          setForm(ruleToForm(r))
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={r.active ? 'Выключить' : 'Включить'}
                        onClick={() => toggle.mutate(r.id)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-brand-bad hover:text-brand-bad"
                        title="Удалить"
                        onClick={() => remove.mutate(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListTable>
      )}
    </ListShell>
  )
}
