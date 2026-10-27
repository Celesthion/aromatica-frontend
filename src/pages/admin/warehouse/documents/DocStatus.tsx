import type { ComponentProps } from 'react'
import { Badge, StatusChip } from '@/shared/ui'
import type { DocStatus } from '@/shared/api'
import { DOC_STATUS_LABELS } from '@/pages/admin/lib/labels'

const BADGE_VARIANT: Record<DocStatus, ComponentProps<typeof Badge>['variant']> = {
  DRAFT: 'secondary',
  POSTED: 'default',
  CANCELLED: 'danger',
}

const CHIP_TONE: Record<DocStatus, ComponentProps<typeof StatusChip>['tone']> = {
  DRAFT: 'warning',
  POSTED: 'active',
  CANCELLED: 'danger',
}

export function DocStatusBadge({ status }: { status: DocStatus }) {
  return <Badge variant={BADGE_VARIANT[status]}>{DOC_STATUS_LABELS[status]}</Badge>
}

/** Чип статуса для шапки фаст-вью. */
export function DocStatusChip({ status, className }: { status: DocStatus; className?: string }) {
  return (
    <StatusChip tone={CHIP_TONE[status]} className={className}>
      {DOC_STATUS_LABELS[status]}
    </StatusChip>
  )
}
