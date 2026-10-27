import { create } from 'zustand'
import type { PosProduct } from '@/shared/api'

// товар для экрана /split: PosProduct целиком через параметры маршрута не передать
interface SplitState {
  product: PosProduct | null
  setProduct: (p: PosProduct | null) => void
}

export const useSplit = create<SplitState>((set) => ({
  product: null,
  setProduct: (product) => set({ product }),
}))
