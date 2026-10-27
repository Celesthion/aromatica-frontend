import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  cancelDoc,
  createDoc,
  postDoc,
  unpostDoc,
  updateDoc,
  type DocDto,
  type DocRequest,
} from '@/shared/api'
import { invalidateDoc } from './docQueries'

export function useDocMutations({
  docId,
  basePath,
  buildRequest,
  onClose,
}: {
  docId: string
  /** Например '/admin/moves'. */
  basePath: string
  buildRequest: () => DocRequest
  /** Модальный режим: вместо перехода по роуту закрываем модалку. */
  onClose?: () => void
}) {
  const isNew = docId === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const invalidate = () => invalidateDoc(queryClient, docId)

  const save = useMutation({
    mutationFn: () => (isNew ? createDoc(buildRequest()) : updateDoc(docId, buildRequest())),
    onSuccess: (saved: DocDto) => {
      setError(null)
      invalidate()
      if (onClose) {
        onClose()
      } else if (isNew) {
        navigate({ to: `${basePath}/$docId`, params: { docId: saved.id }, replace: true })
      }
    },
    onError: (e) => setError(e.message),
  })

  const post = useMutation({
    mutationFn: async () => {
      const saved = isNew ? await createDoc(buildRequest()) : await updateDoc(docId, buildRequest())
      return postDoc(saved.id)
    },
    onSuccess: (posted) => {
      setError(null)
      invalidate()
      if (onClose) {
        onClose()
      } else {
        navigate({ to: `${basePath}/$docId`, params: { docId: posted.id }, replace: true })
      }
    },
    onError: (e) => setError(e.message),
  })

  const unpost = useMutation({
    mutationFn: () => unpostDoc(docId),
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: (e) => setError(e.message),
  })

  const cancel = useMutation({
    mutationFn: () => cancelDoc(docId),
    onSuccess: () => {
      invalidate()
      if (onClose) {
        onClose()
      } else {
        navigate({ to: basePath })
      }
    },
    onError: (e) => setError(e.message),
  })

  const busy = save.isPending || post.isPending || unpost.isPending || cancel.isPending
  return { save, post, unpost, cancel, busy, error }
}
