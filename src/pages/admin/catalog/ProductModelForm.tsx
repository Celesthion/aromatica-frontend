import { X } from 'lucide-react'
import { Button, ButtonSpinner, Input, Field } from '@/shared/ui'
import type { ProductGender, ProductModelRequest } from '@/shared/api'
import { PRODUCT_GENDER_LABELS } from '@/pages/admin/lib/labels'
import { BrandCombobox } from './BrandCombobox'
import { ProductImages, ProductImagesHint } from './ProductImages'

export interface ProductModelFormState {
  id: string | null
  brand: string
  name: string
  description: string
  gender: ProductGender | ''
}

export const EMPTY_MODEL_FORM: ProductModelFormState = {
  id: null,
  brand: '',
  name: '',
  description: '',
  gender: '',
}

export function modelToForm(m: {
  id: string
  brand: string | null
  name: string
  description: string | null
  gender: ProductGender | null
}): ProductModelFormState {
  return {
    id: m.id,
    brand: m.brand ?? '',
    name: m.name,
    description: m.description ?? '',
    gender: m.gender ?? '',
  }
}

export function modelFormToRequest(f: ProductModelFormState): ProductModelRequest {
  return {
    // пустой бренд у служебных продуктов вроде упаковки
    brand: f.brand.trim() || null,
    name: f.name.trim(),
    description: f.description.trim() || null,
    gender: f.gender || null,
  }
}

export function ProductModelForm({
  form,
  setForm,
  error,
  busy,
  onSubmit,
  onClose,
}: {
  form: ProductModelFormState
  setForm: (f: ProductModelFormState) => void
  error: string | null
  busy: boolean
  onSubmit: () => void
  onClose: () => void
}) {
  const invalid = !form.name.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onSubmit()
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">{form.id ? 'Редактирование продукта' : 'Новый продукт'}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={
            <>
              Бренд <span className="text-muted-foreground/60">(необязательно)</span>
            </>
          }
        >
          <BrandCombobox
            value={form.brand}
            allowEmpty
            onChange={(name) => setForm({ ...form, brand: name })}
          />
        </Field>
        <Field label="Название">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Velvet Oud"
          />
        </Field>
        <Field
          label={
            <>
              Пол <span className="text-muted-foreground/60">(необязательно)</span>
            </>
          }
        >
          <select
            className="field w-full"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as ProductGender | '' })}
          >
            <option value="">— не указан —</option>
            {(Object.keys(PRODUCT_GENDER_LABELS) as ProductGender[]).map((g) => (
              <option key={g} value={g}>
                {PRODUCT_GENDER_LABELS[g]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Фотографии" className="sm:col-span-2">
          {form.id ? <ProductImages modelId={form.id} /> : <ProductImagesHint />}
        </Field>
        <Field label="Описание" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="необязательно"
            className="field w-full resize-y !rounded-xl !h-auto min-h-[84px] py-2.5"
          />
        </Field>
      </div>

      {error && <p className="mt-2 text-sm text-brand-bad">{error}</p>}
      <div className="mt-4 flex justify-center gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={busy || invalid}>
          {busy ? <ButtonSpinner spaced /> : null}
          {form.id ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}
