import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api'

// любое действие с документом может менять остатки, деньги и журнал событий
export function invalidateDoc(queryClient: QueryClient, docId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.docs.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.stock.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.moneyAccounts })
  queryClient.invalidateQueries({ queryKey: queryKeys.moneyMovements.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.debts })
  if (docId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.doc(docId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.docEvents(docId) })
  }
}
