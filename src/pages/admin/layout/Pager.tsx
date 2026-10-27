import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui'

/** Пагинация журнала: общего числа страниц сервер не считает, листаем по hasNext. */
export function Pager({
  page,
  hasNext,
  onChange,
}: {
  page: number
  hasNext: boolean
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-muted-foreground" />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          title="Предыдущая страница"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">{page + 1}</span>
        <Button
          variant="ghost"
          size="icon"
          disabled={!hasNext}
          onClick={() => onChange(page + 1)}
          title="Следующая страница"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
