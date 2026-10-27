import { Plus } from 'lucide-react'
import { Combobox, ComboboxAction } from '@/shared/ui'
import { searchProductModels, type ProductModelPick, queryKeys } from '@/shared/api'
import { modelTitle } from '@/pages/admin/lib/labels'

const modelLabel = (m: ProductModelPick) => modelTitle(m.brand, m.name)

/** Выбор продукта с поиском на сервере; кнопка "+" создаёт новый продукт. */
export function ProductModelCombobox({
  value,
  label,
  onChange,
  onCreateNew,
}: {
  /** modelId выбранного продукта или ''. */
  value: string
  label: string
  onChange: (id: string, label: string) => void
  onCreateNew?: () => void
}) {
  return (
    <Combobox<ProductModelPick>
      display={label}
      placeholder="— выберите продукт —"
      searchPlaceholder="Поиск продукта…"
      queryKey={(q) => queryKeys.productModels.search(q)}
      fetch={searchProductModels}
      itemKey={(m) => m.id}
      itemLabel={modelLabel}
      isSelected={(m) => m.id === value}
      onSelect={(m) => onChange(m.id, modelLabel(m))}
      actions={
        onCreateNew &&
        (() => (
          <ComboboxAction title="Новый продукт" hoverTone="brand" onClick={onCreateNew}>
            <Plus className="h-4 w-4" />
          </ComboboxAction>
        ))
      }
    />
  )
}
