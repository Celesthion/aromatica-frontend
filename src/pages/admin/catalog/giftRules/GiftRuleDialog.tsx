import type { Dispatch, SetStateAction } from 'react'
import { Plus } from 'lucide-react'
import { Button, Input, Field, FormDialog } from '@/shared/ui'
import type { ProductUnit } from '@/shared/api'
import { ConditionEditor } from './ConditionEditor'
import { GiftItemEditor } from './GiftItemEditor'
import {
  groupNumbers,
  newCondition,
  newItem,
  validateGiftRuleForm,
  type FormCondition,
  type FormItem,
  type GiftRuleFormState,
} from './giftRuleForm'

export function GiftRuleDialog({
  form,
  setForm,
  giftKinds,
  activeKinds,
  kindName,
  isArchivedKind,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  form: GiftRuleFormState
  setForm: Dispatch<SetStateAction<GiftRuleFormState | null>>
  giftKinds: { code: string; name: string; unit: ProductUnit }[]
  activeKinds: { code: string; name: string }[]
  kindName: (code: string) => string
  isArchivedKind: (code: string) => boolean
  busy: boolean
  error: string | null
  onSubmit: () => void
  onClose: () => void
}) {
  const { invalid, stepBad, stepNeedsSum, maxGiftsBad } = validateGiftRuleForm(form)
  const groups = groupNumbers(form)

  const patchCondition = (key: string, patch: Partial<FormCondition>) =>
    setForm((f) =>
      f ? { ...f, conditions: f.conditions.map((c) => (c.key === key ? { ...c, ...patch } : c)) } : f,
    )
  const patchItem = (key: string, patch: Partial<FormItem>) =>
    setForm((f) =>
      f ? { ...f, items: f.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) } : f,
    )

  return (
    <FormDialog
      title={form.id ? 'Редактирование правила' : 'Новое правило подарка'}
      maxWidth="max-w-2xl"
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={form.id ? 'Сохранить' : 'Создать'}
      busy={busy}
      disabled={invalid}
      error={error}
    >
      <Field label="Название (видно только вам)">
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Пробник в подарок за покупку"
          autoFocus
        />
      </Field>

      <div className="rounded-xl border border-border/60 p-3">
        <p className="mb-1 text-sm font-medium">Что дарим (набор)</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Все позиции выдаются вместе. Выбери форму и количество; товар — по желанию. Без товара на кассе
          выдадут любой товар этой формы.
        </p>
        <div className="space-y-2">
          {form.items.map((it) => (
            <GiftItemEditor
              key={it.key}
              item={it}
              kinds={giftKinds}
              currentKindName={it.kind ? kindName(it.kind) : ''}
              canRemove={form.items.length > 1}
              onChange={(patch) => patchItem(it.key, patch)}
              onRemove={() => setForm({ ...form, items: form.items.filter((x) => x.key !== it.key) })}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setForm({ ...form, items: [...form.items, newItem()] })}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить позицию
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 p-3">
        <p className="text-sm font-medium">Когда дарим</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Внутри группы нужны все условия сразу. Групп несколько — хватит любой из них.
        </p>

        <div className="space-y-2">
          {groups.map((g, gi) => {
            const groupConds = form.conditions.filter((c) => c.group === g)
            return (
              <div key={g}>
                {gi > 0 && (
                  <p className="my-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    или
                  </p>
                )}
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
                  <div className="space-y-2">
                    {groupConds.map((c, i) => (
                      <div key={c.key}>
                        {i > 0 && (
                          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            и
                          </p>
                        )}
                        <ConditionEditor
                          cond={c}
                          kinds={activeKinds}
                          archivedKind={isArchivedKind(c.kind) ? kindName(c.kind) : null}
                          canRemove={form.conditions.length > 1}
                          onChange={(patch) => patchCondition(c.key, patch)}
                          onRemove={() =>
                            setForm({
                              ...form,
                              conditions: form.conditions.filter((x) => x.key !== c.key),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setForm({ ...form, conditions: [...form.conditions, newCondition(g)] })}
                  >
                    + условие в эту группу (И)
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            setForm({
              ...form,
              conditions: [...form.conditions, newCondition(Math.max(...groups) + 1)],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить группу (ИЛИ)
        </Button>
      </div>

      <details className="rounded-xl border border-border/60 p-3">
        <summary className="cursor-pointer text-sm font-medium">Дополнительно</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field
            label="+1 подарок за каждые, с"
            hint={
              stepNeedsSum
                ? 'Нужно условие по сумме чека'
                : stepBad
                  ? 'Сумма больше нуля'
                  : 'Сверх суммы чека'
            }
            hintTone={stepBad || stepNeedsSum ? 'error' : 'muted'}
          >
            <Input
              inputMode="decimal"
              value={form.stepSom}
              onChange={(e) => setForm({ ...form, stepSom: e.target.value })}
              placeholder="не повторяется"
            />
          </Field>
          <Field
            label="Макс. подарков на чек"
            hint={maxGiftsBad ? 'Целое число больше нуля' : undefined}
            hintTone="error"
          >
            <Input
              inputMode="numeric"
              value={form.maxGifts}
              onChange={(e) => setForm({ ...form, maxGifts: e.target.value })}
              placeholder="без ограничения"
            />
          </Field>
        </div>
      </details>
    </FormDialog>
  )
}
