import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui'
import { fetchWarehouses, queryKeys } from '@/shared/api'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import { MoveEditorPage } from '@/pages/admin/warehouse/MoveEditorPage'
import { SectionNav } from '@/pages/admin/layout/SectionNav'
import { DocEditor } from './DocEditor'
import { DocList } from './DocList'
import { DOC_CONFIGS, docConfig, type ConfiguredDocType } from './docConfigs'

const RETURN_TYPES: ConfiguredDocType[] = ['RETURN', 'RETURN_SUPPLY']
const ADJUSTMENT_TYPES: ConfiguredDocType[] = ['WRITE_OFF', 'SURPLUS', 'INVENTORY']

/** Раздел документов: кнопка создания, список и табы, если типов несколько. */
function DocSectionPage({
  basePath,
  types,
  notice,
  disableNew,
  editor,
}: {
  basePath: string
  types: ConfiguredDocType[]
  notice?: ReactNode
  disableNew?: boolean
  /** Свой редактор черновиков (у MOVE). */
  editor?: (docId: string, onClose: () => void) => ReactNode
}) {
  const [active, setActive] = useState<ConfiguredDocType>(types[0])
  const [creating, setCreating] = useState(false)
  const config = docConfig(active)

  const body = (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {creating && (
        <EditorModal onClose={() => setCreating(false)}>
          {editor ? (
            editor('new', () => setCreating(false))
          ) : (
            <DocEditor
              docId="new"
              basePath={basePath}
              configs={DOC_CONFIGS}
              newType={active}
              onClose={() => setCreating(false)}
            />
          )}
        </EditorModal>
      )}
      <DocList
        type={active}
        basePath={basePath}
        notice={notice}
        editor={editor}
        toolbar={
          <Button disabled={disableNew} onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {config.newLabel ?? config.titleNew}
          </Button>
        }
      />
    </div>
  )

  if (types.length === 1) return <div className="h-full">{body}</div>
  return (
    <div className="flex h-full flex-col gap-3 md:flex-row md:gap-5">
      <SectionNav
        items={types.map((t) => ({ value: t, label: docConfig(t).tabLabel ?? t }))}
        active={active}
        onChange={setActive}
      />
      {body}
    </div>
  )
}

/** Редактор документа по роуту; тип нового документа из ?type=, если он входит в раздел. */
function DocEditorRoute({ basePath, types }: { basePath: string; types: ConfiguredDocType[] }) {
  const { docId } = useParams({ strict: false }) as { docId: string }
  const { type } = useSearch({ strict: false }) as { type?: ConfiguredDocType }
  const newType = type && types.includes(type) ? type : types[0]
  return <DocEditor docId={docId} basePath={basePath} configs={DOC_CONFIGS} newType={newType} />
}

export const SuppliesPage = () => <DocSectionPage basePath="/admin/supplies" types={['SUPPLY']} />
export const SupplyEditorPage = () => <DocEditorRoute basePath="/admin/supplies" types={['SUPPLY']} />

export const SalesPage = () => <DocSectionPage basePath="/admin/sales" types={['SALE']} />
export const SaleEditorPage = () => <DocEditorRoute basePath="/admin/sales" types={['SALE']} />

export const ReturnsPage = () => <DocSectionPage basePath="/admin/returns" types={RETURN_TYPES} />
export const ReturnEditorPage = () => <DocEditorRoute basePath="/admin/returns" types={RETURN_TYPES} />

export const AdjustmentsPage = () => <DocSectionPage basePath="/admin/adjustments" types={ADJUSTMENT_TYPES} />
export const AdjustmentEditorPage = () => (
  <DocEditorRoute basePath="/admin/adjustments" types={ADJUSTMENT_TYPES} />
)

/** Перемещения: свой редактор с двумя складами; меньше двух складов - предупреждение. */
export function MovesPage() {
  const warehouses = useQuery({ queryKey: queryKeys.warehouses, queryFn: fetchWarehouses })
  const notEnough = !warehouses.isLoading && (warehouses.data?.length ?? 0) < 2
  return (
    <DocSectionPage
      basePath="/admin/moves"
      types={['MOVE']}
      disableNew={notEnough}
      editor={(docId, onClose) => <MoveEditorPage docId={docId} onClose={onClose} />}
      notice={
        notEnough ? (
          <p className="mb-6 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Для перемещений нужно минимум два склада — добавьте второй на вкладке{' '}
            <Link to="/admin/warehouses" className="underline underline-offset-4">
              Склады
            </Link>
            .
          </p>
        ) : null
      }
    />
  )
}
