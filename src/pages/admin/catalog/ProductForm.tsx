import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, ButtonSpinner, Input, Field } from '@/shared/ui'
import { createProductModel, type ProductKind, type ProductModel, queryKeys } from '@/shared/api'
import { KIND_LABELS } from '@/entities/kind/kindLabels'
import { useKinds, useKindLabels } from '@/entities/kind/useKinds'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import { modelTitle } from '@/pages/admin/lib/labels'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { ProductPicker } from '@/pages/admin/warehouse/documents/ProductPicker'
import { ProductModelCombobox } from './ProductModelCombobox'
import {
  EMPTY_MODEL_FORM,
  ProductModelForm,
  modelFormToRequest,
  type ProductModelFormState,
} from './ProductModelForm'
import { componentsValid, composeName, type ProductFormState } from './productFormModel'

/** Форма товара для раздела "Товары" и подбора в документах; продукт можно создать на лету. */
export function ProductForm({
  form,
  setForm,
  error,
  busy,
  onSubmit,
  onClose,
}: {
  form: ProductFormState
  setForm: (f: ProductFormState) => void
  error: string | null
  busy: boolean
  onSubmit: () => void
  onClose: () => void
}) {
  const [creatingModel, setCreatingModel] = useState(false)
  // пока справочник грузится, показываем системные формы
  const kinds = useKinds()
  const kindLabel = useKindLabels()
  const kindOptions = kinds.data?.length
    ? kinds.data
    : Object.entries(KIND_LABELS).map(([code, name]) => ({ code, name }))
  const previewName = composeName({
    modelLabel: form.modelLabel,
    kind: form.kind,
    kindName: kindLabel(form.kind),
    label: form.label,
    volumeMl: form.volumeMl,
  })

  // объём подставляется при вскрытии; у атомайзера он задаёт вариант распива
  const volumeRequired = form.kind === 'BOTTLE' || form.kind === 'TESTER' || form.kind === 'ATOMIZER'
  // распив и разлив продаются по мл, поэтому цена задаётся за 1 мл
  const perMlPrice = form.kind === 'SPLIT' || form.kind === 'BULK'
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (form.modelId) onSubmit()
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">{form.id ? 'Редактирование товара' : 'Новый товар'}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Продукт">
            <ProductModelCombobox
              value={form.modelId}
              label={form.modelLabel}
              onChange={(id, modelLabel) => setForm({ ...form, modelId: id, modelLabel })}
              onCreateNew={() => setCreatingModel(true)}
            />
          </Field>
          <Field label="Форма">
            <select
              className="field w-full"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as ProductKind })}
            >
              {kindOptions.map((k) => (
                <option key={k.code} value={k.code}>
                  {k.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Название" hint="необязательно — отличие варианта, напр. цвет">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="напр. Зелёный"
            />
          </Field>
          <Field label={perMlPrice ? 'Цена за 1 мл, с' : 'Цена продажи, с'}>
            <Input
              inputMode="decimal"
              value={form.priceSom}
              onChange={(e) => setForm({ ...form, priceSom: e.target.value })}
              placeholder="3500"
            />
          </Field>

          {volumeRequired && (
            <Field
              label="Объём, мл"
              hint={
                form.kind === 'ATOMIZER'
                  ? 'Обязательно — объём атомайзера задаёт вариант распива/разлива в кассе'
                  : 'Обязательно — подставится при вскрытии, вручную вводить не придётся'
              }
              hintTone={form.volumeMl.trim() ? 'muted' : 'error'}
            >
              <Input
                inputMode="decimal"
                value={form.volumeMl}
                onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
                placeholder="100"
              />
            </Field>
          )}

          {/* цена комплекта фиксированная, скидка на кассе не даётся */}
          {form.kind === 'KIT' && (
            <Field
              label="Состав комплекта"
              className="sm:col-span-2"
              hint={
                form.components.length === 0
                  ? 'Добавьте хотя бы одну составляющую'
                  : 'на одну штуку комплекта'
              }
              hintTone={form.components.length === 0 ? 'error' : 'muted'}
            >
              <div className="space-y-2">
                {form.components.map((c, idx) => (
                  <div key={c.productId} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                    <Input
                      className="h-9 w-24 text-right"
                      inputMode="decimal"
                      value={c.qty}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          components: form.components.map((x, i) =>
                            i === idx ? { ...x, qty: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm({ ...form, components: form.components.filter((_, i) => i !== idx) })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {/* KIT, READY и BASE в комплект не вкладываются */}
                <ProductPicker
                  excludeKinds={['KIT', 'READY', 'BASE']}
                  onPick={(p) => {
                    if (form.components.some((c) => c.productId === p.id)) return
                    setForm({
                      ...form,
                      components: [...form.components, { productId: p.id, name: p.name, qty: '1' }],
                    })
                  }}
                />
              </div>
            </Field>
          )}

          <Field label="Описание" className="sm:col-span-2">
            <textarea
              className="field w-full resize-y !rounded-xl !h-auto min-h-[84px] py-2.5"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="необязательно"
            />
          </Field>
        </div>
        <div className="mt-3 flex items-baseline gap-2 rounded-xl bg-secondary/60 px-3 py-2">
          <span className="shrink-0 text-xs text-muted-foreground">Имя товара:</span>
          <span className="min-w-0 truncate text-sm font-medium">
            {previewName || <span className="text-muted-foreground">выберите продукт и форму</span>}
          </span>
        </div>
        {error && <p className="mt-2 text-sm text-brand-bad">{error}</p>}
        <div className="mt-4 flex justify-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={
              busy ||
              !form.modelId ||
              !form.priceSom.trim() ||
              (volumeRequired && !form.volumeMl.trim()) ||
              !componentsValid(form)
            }
          >
            {busy ? <ButtonSpinner spaced /> : null}
            {form.id ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>

      {/* вне формы товара: вложенные form недопустимы */}
      {creatingModel && (
        <NewModelDialog
          onCreated={(m) => {
            setCreatingModel(false)
            setForm({ ...form, modelId: m.id, modelLabel: modelTitle(m.brand, m.name) })
          }}
          onClose={() => setCreatingModel(false)}
        />
      )}
    </>
  )
}

function NewModelDialog({
  onCreated,
  onClose,
}: {
  onCreated: (model: ProductModel) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ProductModelFormState>({ ...EMPTY_MODEL_FORM })
  const create = useEntityMutation({
    mutationFn: (f: ProductModelFormState) => createProductModel(modelFormToRequest(f)),
    invalidate: [queryKeys.productModels.all],
    onDone: onCreated,
  })

  return (
    <EditorModal maxWidth="max-w-2xl" onClose={onClose}>
      <ProductModelForm
        form={form}
        setForm={setForm}
        error={create.error}
        busy={create.isPending}
        onSubmit={() => create.mutate(form)}
        onClose={onClose}
      />
    </EditorModal>
  )
}
