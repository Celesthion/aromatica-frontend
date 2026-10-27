import { Field } from '@/shared/ui'
import type { Role, WarehouseInfo } from '@/shared/api'
import { ASSIGNABLE_ROLES, ROLE_LABELS, roleUsesWarehouses } from '@/entities/staff/roles'
import { MultiSelect } from '@/pages/admin/layout/MultiSelect'

interface RoleAccess {
  role: Role
  warehouseIds: string[]
}

/** Роль и склады сотрудника; склады только у ролей, привязанных к складу. */
export function StaffRoleFields({
  value,
  warehouses,
  onChange,
}: {
  value: RoleAccess
  warehouses: WarehouseInfo[]
  onChange: (patch: Partial<RoleAccess>) => void
}) {
  return (
    <>
      <Field label="Роль">
        <select
          className="field w-full"
          value={value.role}
          onChange={(e) => onChange({ role: e.target.value as Role })}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>
      {roleUsesWarehouses(value.role) && (
        <div className="block text-sm">
          <span className="mb-0.5 block text-xs text-muted-foreground">Доступ к складам</span>
          <MultiSelect
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={value.warehouseIds}
            onChange={(warehouseIds) => onChange({ warehouseIds })}
            placeholder="Выберите склады…"
          />
        </div>
      )}
    </>
  )
}
