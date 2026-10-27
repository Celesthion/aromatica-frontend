import { useQuery } from '@tanstack/react-query'
import { fetchProductKinds, type ProductKindInfo, queryKeys } from '@/shared/api'
import { KIND_LABELS } from './kindLabels'

/** Активные формы товара. Меняются редко, поэтому кэшируем надолго. */
export function useKinds() {
  return useQuery({
    queryKey: queryKeys.kinds.all,
    queryFn: () => fetchProductKinds(),
    staleTime: 5 * 60_000,
  })
}

/** Название формы по коду: из справочника, затем системная подпись, иначе сам код. */
export function useKindLabels(): (kind: string) => string {
  const kinds = useKinds()
  const fromServer = new Map((kinds.data ?? []).map((k: ProductKindInfo) => [k.code, k.name]))
  return (kind: string) => fromServer.get(kind) ?? KIND_LABELS[kind] ?? kind
}
