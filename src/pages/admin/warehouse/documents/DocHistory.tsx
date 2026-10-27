import { useQuery } from '@tanstack/react-query'
import { fetchDocEvents, queryKeys } from '@/shared/api'
import { dateTimeFmt } from '@/shared/lib/format'

const EVENT_LABELS: Record<string, string> = {
  POST: 'провёл',
  UNPOST: 'распровёл',
  CANCEL: 'отменил',
  VOID: 'сторнировал с кассы',
  PAY: 'оплатил',
}

export function docEventLine(e: { at: string; login: string | null; action: string }): string {
  return `${dateTimeFmt(e.at)} — ${e.login ?? '?'} ${EVENT_LABELS[e.action] ?? e.action}`
}

export function DocHistory({ docId }: { docId: string }) {
  const events = useQuery({
    queryKey: queryKeys.docEvents(docId),
    queryFn: () => fetchDocEvents(docId),
  })
  if (!events.data || events.data.length === 0) return null
  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">История</p>
      {events.data.map((e, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {docEventLine(e)}
        </p>
      ))}
    </div>
  )
}
