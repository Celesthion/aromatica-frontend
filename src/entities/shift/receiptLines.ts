import type { LineDto } from '@/shared/api'

// парфюмерную воду (BASE) сервер дописывает в чек для склада и себестоимости, клиент её не покупал
export const isCustomerLine = (l: LineDto) => l.productKind !== 'BASE'
