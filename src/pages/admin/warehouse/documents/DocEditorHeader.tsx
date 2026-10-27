import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Undo2, X } from 'lucide-react'
import { Button, ButtonSpinner } from '@/shared/ui'
import type { DocStatus } from '@/shared/api'
import { DocStatusBadge } from './DocStatus'
import type { useDocMutations } from './useDocMutations'

export function DocEditorHeader({
  title,
  status,
  isNew,
  basePath,
  onClose,
  postDisabled,
  linesCount,
  mutations,
}: {
  title: string
  status: DocStatus
  isNew: boolean
  basePath: string
  onClose?: () => void
  /** Дополнительное условие блокировки кнопки "Провести". */
  postDisabled?: boolean
  linesCount: number
  mutations: ReturnType<typeof useDocMutations>
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link to={basePath}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <h1 className="font-display text-3xl tracking-tight">{title}</h1>
        {!isNew && <DocStatusBadge status={status} />}
      </div>
      <div className="flex gap-2">
        {status === 'DRAFT' && (
          <>
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                disabled={mutations.busy}
                onClick={() => mutations.cancel.mutate()}
              >
                <X className="mr-2 h-4 w-4" />
                Отменить документ
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={mutations.busy}
              onClick={() => mutations.save.mutate()}
            >
              Сохранить черновик
            </Button>
            <Button
              size="sm"
              disabled={mutations.busy || linesCount === 0 || postDisabled}
              onClick={() => mutations.post.mutate()}
            >
              {mutations.post.isPending ? <ButtonSpinner spaced /> : <Check className="mr-2 h-4 w-4" />}
              Провести
            </Button>
          </>
        )}
        {status === 'POSTED' && (
          <Button
            variant="outline"
            size="sm"
            disabled={mutations.busy}
            onClick={() => mutations.unpost.mutate()}
          >
            {mutations.unpost.isPending ? <ButtonSpinner spaced /> : <Undo2 className="mr-2 h-4 w-4" />}
            Распровести
          </Button>
        )}
      </div>
    </div>
  )
}
