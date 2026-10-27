import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, FileClock, FileText, Wallet } from 'lucide-react'
import { PageLoader, useSort, SortTh } from '@/shared/ui'
import { fetchDocs, queryKeys } from '@/shared/api'
import { dateTimeFmt, money } from '@/shared/lib/format'
import { FastViewPortal } from '@/pages/admin/layout/FastView'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
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
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import { DocStatusBadge } from './DocStatus'
import { DocEditor } from './DocEditor'
import { DocFastView } from './DocFastView'
import { DOC_CONFIGS, docConfig, type ConfiguredDocType } from './docConfigs'

/** Таблица документов одного типа с поиском и фаст-вью. */
export function DocList({
  type,
  basePath,
  toolbar,
  notice,
  editor,
}: {
  type: ConfiguredDocType
  basePath: string
  /** Кнопки создания. */
  toolbar?: ReactNode
  /** Плашка над списком. */
  notice?: ReactNode
  /** Свой редактор черновика (MOVE) вместо общего DocEditor. */
  editor?: (docId: string, onClose: () => void) => ReactNode
}) {
  const config = docConfig(type)
  const counterpartyHeader = config.listCounterpartyHeader
  const EmptyIcon = config.emptyIcon ?? FileText
  const [q, setQ] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => setPreviewId(null), [type])

  const { sort, toggle } = useSort({ key: 'date', dir: 'desc' })
  const list = useInfiniteList(queryKeys.docs.list(type, q, sort), (page) =>
    fetchDocs({ type, page, size: 30, q, sort }),
  )

  // KPI считаются по загруженным строкам, "Всего" приходит с сервера
  const loaded = list.rows
  const postedCount = loaded.filter((d) => d.status === 'POSTED').length
  const draftCount = loaded.filter((d) => d.status === 'DRAFT').length
  const loadedSum = loaded.reduce((s, d) => s + d.sumMinor, 0)

  const stats = (
    <ListStats>
      <KpiCard
        label="Всего документов"
        value={String(list.total)}
        sub={`загружено ${loaded.length}`}
        icon={FileText}
        dark
      />
      <KpiCard
        label="Проведено"
        value={String(postedCount)}
        sub="из загруженных"
        icon={CheckCircle2}
        tone="good"
        dark
      />
      <KpiCard
        label="Черновики"
        value={String(draftCount)}
        sub="из загруженных"
        icon={FileClock}
        tone="warn"
        dark
      />
      <KpiCard
        label="Сумма загруженных"
        value={money(loadedSum)}
        sub="по текущей выборке"
        icon={Wallet}
        dark
      />
    </ListStats>
  )

  // ключ держит поле поиска смонтированным при переходе между пустым и обычным видом
  const toolbarRow = (
    <ListToolbar
      key="toolbar"
      onSearch={setQ}
      placeholder={counterpartyHeader ? 'Поиск по № или контрагенту…' : 'Поиск по №…'}
    >
      {toolbar}
    </ListToolbar>
  )

  const overlays = (
    <>
      {editingId && (
        <EditorModal onClose={() => setEditingId(null)}>
          {editor ? (
            editor(editingId, () => setEditingId(null))
          ) : (
            <DocEditor
              docId={editingId}
              basePath={basePath}
              configs={DOC_CONFIGS}
              newType={type}
              onClose={() => setEditingId(null)}
            />
          )}
        </EditorModal>
      )}
      <FastViewPortal open={previewId != null}>
        {previewId && (
          <DocFastView
            docId={previewId}
            config={config}
            onClose={() => setPreviewId(null)}
            onEdit={setEditingId}
          />
        )}
      </FastViewPortal>
    </>
  )

  if (list.isLoading) {
    return <PageLoader />
  }

  if (list.rows.length === 0 && q === '') {
    return (
      <ListShell>
        {toolbarRow}
        {notice}
        <ListEmpty icon={<EmptyIcon className="h-10 w-10" />}>{config.emptyText}</ListEmpty>
      </ListShell>
    )
  }

  return (
    <ListShell>
      {stats}
      {overlays}
      {toolbarRow}
      {notice}
      <ListTable ref={list.rootRef}>
        <table className={TABLE}>
          <thead className={THEAD}>
            <tr className={THEAD_TR}>
              <SortTh label="№" sortKey="number" sort={sort} onSort={toggle} />
              <SortTh label="Дата" sortKey="date" sort={sort} onSort={toggle} />
              {counterpartyHeader && <th className="px-4 py-3 font-medium">{counterpartyHeader}</th>}
              {!previewId && <th className="px-4 py-3 text-right font-medium">Позиций</th>}
              <SortTh
                label={config.sumHeader ?? 'Сумма'}
                sortKey="sum"
                sort={sort}
                onSort={toggle}
                align="right"
              />
              <SortTh label="Статус" sortKey="status" sort={sort} onSort={toggle} />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((d) => (
              <tr
                key={d.id}
                className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                  previewId === d.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                }`}
                onClick={() => setPreviewId(d.id)}
              >
                <td className="px-4 py-3 font-medium">№{d.number}</td>
                <td className="px-4 py-3" data-label="Дата">
                  {dateTimeFmt(d.moment)}
                </td>
                {counterpartyHeader && (
                  <td className="px-4 py-3" data-label={counterpartyHeader}>
                    {d.counterpartyName ?? '—'}
                  </td>
                )}
                {!previewId && (
                  <td className="px-4 py-3 text-right tabular-nums" data-label="Позиций">
                    {d.linesCount}
                  </td>
                )}
                <td className="px-4 py-3 text-right tabular-nums" data-label={config.sumHeader ?? 'Сумма'}>
                  {money(d.sumMinor)}
                </td>
                <td className="px-4 py-3" data-label="Статус">
                  <DocStatusBadge status={d.status} />
                </td>
              </tr>
            ))}
            {list.rows.length === 0 && (
              <tr>
                <td
                  colSpan={counterpartyHeader ? 6 : 5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
      </ListTable>
    </ListShell>
  )
}
