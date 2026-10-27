import { adminFetch, del, type Paged, post, put, searchPaged, sortBody, type SortParam } from './core'

export interface DocEvent {
  action: 'POST' | 'UNPOST' | 'CANCEL' | 'VOID' | 'PAY'
  login: string | null
  at: string
}

export function fetchDocEvents(docId: string): Promise<DocEvent[]> {
  return adminFetch(`/api/admin/docs/${docId}/events`)
}

export type DocType =
  | 'SUPPLY'
  | 'SALE'
  | 'WRITE_OFF'
  | 'SURPLUS'
  | 'INVENTORY'
  | 'MOVE'
  | 'CONVERT'
  | 'RETURN'
  | 'RETURN_SUPPLY'
  | 'ASSEMBLY' // сборка: составляющие в вещь с составом (на полку)
  | 'DISASSEMBLY' // разборка: вещь в составляющие
export type DocStatus = 'DRAFT' | 'POSTED' | 'CANCELLED'

export interface LineRequest {
  productId: string
  qty: number
  priceMinor: number
  /** Скидка строки суммой в тыйынах (сервер хранит именно её). */
  discountMinor: number
  /** Подарок: строка бесплатна, себестоимость списывается. */
  gift?: boolean
  /** По какому правилу выдан подарок (сервер проверяет, что подарок заработан). */
  giftRuleId?: string
  /** Метка набора подарка: строки одного набора считаются одним подарком. */
  giftGroupId?: string
  /** Доля масла в разливе, %; см. LineDto.dilutionPct. Расход воды сервер дописывает сам. */
  dilutionPct?: number
  /** Метка вещи: строки одного флакона (масло и атомайзер) несут одну метку, по ней возврат кладёт флакон на полку целиком. */
  bundleId?: string
  /** Склад строки, если не склад чека: продажа с полки. */
  warehouseId?: string
}

export interface DocRequest {
  type: DocType
  moment?: string
  warehouseId?: string | null
  warehouseToId?: string | null
  counterpartyId?: string | null
  comment?: string | null
  cashMinor?: number
  noCashMinor?: number
  payAccountId?: string | null
  lines: LineRequest[]
}

export interface LineDto {
  id: string
  productId: string
  productName: string
  /** Форма товара: по ней чек отличает, например, парфюмерную воду. */
  productKind: string | null
  qty: number
  priceMinor: number
  /** Процент для справки (2 знака), только для показа. */
  discountPct: number
  /** Скидка строки суммой в тыйынах: основное значение, в отличие от процента. */
  discountMinor: number
  costMinor: number | null
  sumMinor: number
  lineNo: number
  gift: boolean
  /**
   * Разлив: доля масла в спрее, проценты. qty это миллилитры масла, клиент унёс
   * флакон объёмом qty * 100 / dilutionPct. null: строка не про разлив.
   */
  dilutionPct: number | null
  /** Метка вещи: строки с одной меткой показываются одной (флакон). */
  bundleId: string | null
  /** Склад строки, если не склад документа (полка). */
  warehouseId: string | null
}

export interface DocDto {
  id: string
  docType: DocType
  number: number
  status: DocStatus
  moment: string
  warehouseId: string
  warehouseToId: string | null
  counterpartyId: string | null
  counterpartyName: string | null
  sumMinor: number
  comment: string | null
  cashMinor: number
  noCashMinor: number
  payAccountId: string | null
  createdAt: string
  postedAt: string | null
  createdBy: string | null
  lines: LineDto[]
}

export interface DocListItem {
  id: string
  docType: DocType
  number: number
  status: DocStatus
  moment: string
  counterpartyName: string | null
  sumMinor: number
  linesCount: number
}

export interface DocQuery {
  type: DocType
  page?: number
  size?: number
  q?: string
  sort?: SortParam
}

export function fetchDocs({
  type,
  page = 0,
  size = 50,
  q = '',
  sort,
}: DocQuery): Promise<Paged<DocListItem>> {
  return searchPaged<DocListItem>('/api/admin/docs/search', {
    type,
    page,
    size,
    q: q || undefined,
    ...sortBody(sort),
  })
}

export function fetchDoc(id: string): Promise<DocDto> {
  return adminFetch(`/api/admin/docs/${id}`)
}

export function createDoc(request: DocRequest): Promise<DocDto> {
  return adminFetch('/api/admin/docs', post(request))
}

export function updateDoc(id: string, request: DocRequest): Promise<DocDto> {
  return adminFetch(`/api/admin/docs/${id}`, put(request))
}

export function postDoc(id: string): Promise<DocDto> {
  return adminFetch(`/api/admin/docs/${id}/post`, post())
}

export function unpostDoc(id: string): Promise<DocDto> {
  return adminFetch(`/api/admin/docs/${id}/unpost`, post())
}

export function cancelDoc(id: string): Promise<void> {
  return adminFetch(`/api/admin/docs/${id}`, del())
}
