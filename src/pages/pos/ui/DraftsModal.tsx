import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pause, Play, Trash2 } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Modal, Spinner } from '@/shared/ui'
import { dateTimeFmt, money } from '@/shared/lib/format'
import { deletePosDraft, fetchPosDrafts, type PosDraft, type PosShift, queryKeys } from '@/shared/api'

/** Отложенные чеки: пока клиент думает, чек лежит на сервере, а касса обслуживает следующего. */
export function DraftsModal({
  shift,
  hasCart,
  parking,
  resuming,
  resumeError,
  onPark,
  onResume,
  onClose,
}: {
  shift: PosShift
  hasCart: boolean
  parking: boolean
  /** Пока идёт возврат, кнопки возврата заблокированы, в том числе от двойного клика. */
  resuming: boolean
  /** Битый payload, лимит черновиков или сеть. */
  resumeError: unknown
  onPark: () => void
  onResume: (draft: PosDraft) => void
  onClose: () => void
}) {
  const drafts = useQuery({
    queryKey: queryKeys.pos.drafts.byShift(shift.id),
    queryFn: () => fetchPosDrafts(shift.id),
  })
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<PosDraft | null>(null)
  const doDelete = useMutation({
    mutationFn: (d: PosDraft) => deletePosDraft(d.id),
    onSuccess: () => {
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.all })
    },
  })

  return (
    <Modal align="center" maxWidth="max-w-lg" onClose={onClose} title="Отложенные чеки">
      {hasCart && (
        <Button variant="outline" className="mb-3 w-full justify-center" disabled={parking} onClick={onPark}>
          {parking ? (
            <ButtonSpinner />
          ) : (
            <>
              <Pause className="mr-1.5 h-4 w-4" />
              Отложить текущий чек
            </>
          )}
        </Button>
      )}

      {!drafts.data ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : drafts.data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Отложенных чеков нет</p>
      ) : (
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {drafts.data.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {money(d.sumMinor)} · позиций {d.positions}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dateTimeFmt(d.createdAt)}
                    {d.preview ? ` · ${d.preview}` : ''}
                  </span>
                </span>
                <Button size="sm" disabled={resuming || parking} onClick={() => onResume(d)}>
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Вернуть
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-bad hover:text-brand-bad"
                  onClick={() => setDeleting(d)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {deleting?.id === d.id && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-bad/30 bg-brand-bad/10 px-2.5 py-1.5 text-xs text-brand-bad">
                  <span className="flex-1">Удалить отложенный чек безвозвратно?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={doDelete.isPending}
                    onClick={() => doDelete.mutate(d)}
                  >
                    {doDelete.isPending ? <ButtonSpinner size="sm" /> : 'Удалить'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleting(null)}>
                    Нет
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ErrorNote error={resumeError} className="mt-3" />
      {hasCart && drafts.data && drafts.data.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          «Вернуть» при собранном чеке сначала отложит его — клиенты меняются местами.
        </p>
      )}
    </Modal>
  )
}
