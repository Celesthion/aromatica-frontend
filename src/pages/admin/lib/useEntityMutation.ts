import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/** Мутация с общей обвязкой: после успеха инвалидирует ключи и зовёт onDone, ошибку отдаёт строкой. */
export function useEntityMutation<TArgs = void, TData = unknown>({
  mutationFn,
  invalidate = [],
  onDone,
}: {
  mutationFn: (args: TArgs) => Promise<TData>
  invalidate?: readonly (readonly unknown[])[]
  onDone?: (data: TData) => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn,
    onSuccess: (data) => {
      setError(null)
      for (const key of invalidate) queryClient.invalidateQueries({ queryKey: key })
      onDone?.(data)
    },
    onError: (e) => setError(e.message),
  })
  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
