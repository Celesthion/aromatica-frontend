import type { SortParam } from './core'

// инвалидация идёт по префиксу, поэтому производные ключи начинаются с корня своей сущности
export const queryKeys = {
  admin: ['admin'] as const,
  me: ['admin', 'me'] as const,

  products: {
    all: ['admin', 'products-all'] as const,
    list: (q: string, archived: boolean, sort: SortParam) =>
      ['admin', 'products-all', q, archived, sort.key, sort.dir] as const,
    count: ['admin', 'products-all', 'kpi-count'] as const,
    stock: (productId: string | null, warehouseIds: string) =>
      ['admin', 'product-stock', productId, warehouseIds] as const,
  },
  productSearch: {
    all: ['admin', 'product-search'] as const,
    byQuery: (query: string) => ['admin', 'product-search', query] as const,
    byKind: (query: string, kind: string) => ['admin', 'product-search', query, kind] as const,
  },
  productModels: {
    all: ['admin', 'product-models'] as const,
    list: (q: string, archived: boolean, sort: SortParam) =>
      ['admin', 'product-models', 'page', q, archived, sort.key, sort.dir] as const,
    detail: (id: string | null) => ['admin', 'product-models', 'detail', id] as const,
    search: (q: string) => ['admin', 'product-models', 'search', q] as const,
    images: (modelId: string) => ['admin', 'product-model-images', modelId] as const,
  },
  brands: {
    all: ['admin', 'brands'] as const,
    list: (q: string, archived: boolean, sort: SortParam) =>
      ['admin', 'brands', 'page', q, archived, sort.key, sort.dir] as const,
    count: ['admin', 'brands', 'kpi-count'] as const,
    search: (q: string) => ['admin', 'brands', 'search', q] as const,
  },
  kinds: {
    all: ['admin', 'product-kinds'] as const,
    withArchived: ['admin', 'product-kinds', 'all'] as const,
    list: (archived: boolean) => ['admin', 'product-kinds', 'all', archived] as const,
  },
  giftRules: {
    all: ['admin', 'gift-rules'] as const,
  },
  giftCertificates: {
    all: ['admin', 'gift-certificates'] as const,
    list: (q: string, status: string) => ['admin', 'gift-certificates', 'page', q, status] as const,
    stats: ['admin', 'gift-certificates', 'stats'] as const,
    history: (id: string | undefined) => ['admin', 'gift-certificates', id, 'history'] as const,
  },

  warehouses: ['admin', 'warehouses'] as const,
  stock: {
    all: ['admin', 'stock'] as const,
    list: (warehouseId: string, q: string, sort: SortParam) =>
      ['admin', 'stock', warehouseId, q, sort.key, sort.dir] as const,
    summary: (warehouseId: string | null) => ['admin', 'stock', 'summary', warehouseId] as const,
    rows: (productIds: string) => ['admin', 'stock', 'rows', productIds] as const,
  },
  splitInfo: (productId: string | null) => ['admin', 'split-info', productId] as const,
  history: {
    all: ['admin', 'history'] as const,
    list: (productId: string, warehouseId?: string) =>
      ['admin', 'history', productId, warehouseId ?? 'default'] as const,
  },
  docs: {
    all: ['admin', 'docs'] as const,
    list: (type: string, q: string, sort: SortParam) =>
      ['admin', 'docs', type, q, sort.key, sort.dir] as const,
  },
  doc: (id: string) => ['admin', 'doc', id] as const,
  docEvents: (id: string) => ['admin', 'doc-events', id] as const,
  counterparties: {
    all: ['admin', 'counterparties'] as const,
    list: (q: string, type: string, sort: SortParam) =>
      ['admin', 'counterparties', 'page', q, type, sort.key, sort.dir] as const,
    count: (type: 'SUPPLIER' | 'CUSTOMER') => ['admin', 'counterparties', 'count', type] as const,
    search: (type: string, q: string) => ['admin', 'counterparties', 'search', type, q] as const,
  },

  moneyAccounts: ['admin', 'money-accounts'] as const,
  moneyMovements: {
    all: ['admin', 'money-movements'] as const,
    list: (accountId: string) => ['admin', 'money-movements', accountId] as const,
  },
  debts: ['admin', 'debts'] as const,
  report: (from: string, to: string) => ['admin', 'report', from, to] as const,

  users: {
    all: ['admin', 'users'] as const,
    list: (q: string, role: string, archived: boolean, sort: SortParam) =>
      ['admin', 'users', q, role, archived, sort.key, sort.dir] as const,
    roleCounts: ['admin', 'users', 'role-counts'] as const,
    warehouseAssignees: ['admin', 'users', 'wh-assignees'] as const,
  },
  sellerStats: (userId: string | null) => ['admin', 'seller-stats', userId] as const,
  userActivity: (userId: string | null, section: string | null, page: number, size: number) =>
    ['admin', 'user-activity', userId, section, page, size] as const,

  tasks: {
    all: ['tasks'] as const,
    hub: ['tasks', 'hub'] as const,
    assignees: ['tasks', 'assignees'] as const,
  },

  shifts: {
    list: (q: string, status: string) => ['pos', 'shifts', q, status] as const,
    open: ['pos', 'shifts', 'open'] as const,
  },
  pos: {
    all: ['pos'] as const,
    currentShift: ['pos', 'shift', 'current'] as const,
    openShifts: ['pos', 'shifts-open'] as const,
    settings: ['pos', 'settings'] as const,
    warehouses: ['pos', 'warehouses'] as const,
    kinds: ['pos', 'kinds'] as const,
    summary: {
      all: ['pos', 'summary'] as const,
      byShift: (shiftId: string | undefined) => ['pos', 'summary', shiftId] as const,
    },
    receipts: {
      all: ['pos', 'receipts'] as const,
      byShift: (shiftId: string) => ['pos', 'receipts', shiftId] as const,
    },
    drafts: {
      all: ['pos', 'drafts'] as const,
      byShift: (shiftId: string | null) => ['pos', 'drafts', shiftId] as const,
    },
    products: {
      all: ['pos', 'products'] as const,
      search: (q: string, warehouseId: string | undefined) => ['pos', 'products', q, warehouseId] as const,
      convert: (q: string, warehouseId: string) => ['pos', 'products', 'convert', q, warehouseId] as const,
    },
    convertSplit: (productId: string | undefined) => ['pos', 'convert', 'split', productId] as const,
    customers: {
      all: ['pos', 'customers'] as const,
      search: (q: string) => ['pos', 'customers', q] as const,
    },
    purchases: {
      all: ['pos', 'purchases'] as const,
      byCustomer: (customerId: string | undefined) => ['pos', 'purchases', customerId] as const,
    },
    reservations: {
      all: ['pos', 'reservations'] as const,
      byWarehouse: (warehouseId: string | undefined) => ['pos', 'reservations', warehouseId] as const,
    },
    packaging: {
      all: ['pos', 'packaging'] as const,
      byWarehouse: (warehouseId: string | undefined) => ['pos', 'packaging', warehouseId] as const,
    },
    giftRules: {
      all: ['pos', 'gift-rules'] as const,
      byWarehouse: (warehouseId: string | undefined) => ['pos', 'gift-rules', warehouseId] as const,
    },
    giftProducts: {
      all: ['pos', 'gift-products'] as const,
      list: (kind: string | null, warehouseId: string | undefined) =>
        ['pos', 'gift-products', kind, warehouseId] as const,
    },
    atomizers: {
      all: ['pos', 'atomizers'] as const,
      byWarehouse: (warehouseId: string | undefined) => ['pos', 'atomizers', warehouseId] as const,
    },
    shelf: {
      all: ['pos', 'shelf'] as const,
      byWarehouse: (warehouseId: string | undefined) => ['pos', 'shelf', warehouseId] as const,
    },
  },
}
