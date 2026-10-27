import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Combobox, ComboboxAction } from '@/shared/ui'
import { createBrand, searchBrands, type BrandPick, queryKeys } from '@/shared/api'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { BrandFormDialog } from './BrandFormDialog'

interface BrandForm {
  name: string
}

/** Выбор бренда с поиском. Значение - имя: у продукта бренд хранится строкой. */
export function BrandCombobox({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: string
  onChange: (name: string) => void
  /** Пункт "без бренда" для служебных продуктов вроде упаковки. */
  allowEmpty?: boolean
}) {
  const [form, setForm] = useState<BrandForm | null>(null)

  const create = useEntityMutation({
    mutationFn: (f: BrandForm) => createBrand({ name: f.name.trim() }),
    invalidate: [queryKeys.brands.all],
    onDone: (b) => {
      onChange(b.name)
      setForm(null)
    },
  })

  const openCreate = (name: string) => {
    create.clearError()
    setForm({ name })
  }

  return (
    <>
      <Combobox<BrandPick>
        display={value}
        placeholder="— выберите бренд —"
        searchPlaceholder="Поиск бренда…"
        queryKey={(q) => queryKeys.brands.search(q)}
        fetch={searchBrands}
        itemKey={(b) => b.id}
        itemLabel={(b) => b.name}
        isSelected={(b) => b.name === value}
        onSelect={(b) => onChange(b.name)}
        topItem={
          allowEmpty ? { label: '— без бренда —', selected: !value, onSelect: () => onChange('') } : undefined
        }
        actions={({ query }) => (
          <ComboboxAction title="Новый бренд" hoverTone="brand" onClick={() => openCreate(query)}>
            <Plus className="h-4 w-4" />
          </ComboboxAction>
        )}
      />

      {form && (
        <BrandFormDialog
          title="Новый бренд"
          name={form.name}
          onNameChange={(name) => setForm({ ...form, name })}
          busy={create.isPending}
          error={create.error}
          onSubmit={() => create.mutate(form)}
          onClose={() => setForm(null)}
        />
      )}
    </>
  )
}
