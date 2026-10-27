import type { ComponentProps } from 'react'
import { Modal } from '@/shared/ui'

/** Обычная Modal, только по умолчанию широкая. */
export function EditorModal({ maxWidth = 'max-w-5xl', ...props }: ComponentProps<typeof Modal>) {
  return <Modal maxWidth={maxWidth} {...props} />
}
