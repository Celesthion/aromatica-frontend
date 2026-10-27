import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  type RouteComponent,
} from '@tanstack/react-router'
import {
  AdjustmentEditorPage,
  AdjustmentsPage,
  AdminLayout,
  BrandsPage,
  CounterpartiesPage,
  GiftCertificatesPage,
  GiftRulesPage,
  ModuleHubPage,
  MoneyPage,
  MoveEditorPage,
  MovesPage,
  ProductKindsPage,
  ProductModelsPage,
  ProductsPage,
  ReportsPage,
  ReturnEditorPage,
  ReturnsPage,
  SaleEditorPage,
  SalesPage,
  ShiftsPage,
  StaffPage,
  StockPage,
  SuppliesPage,
  SupplyEditorPage,
  WarehousesPage,
} from '@/pages/admin'
import { PosPage } from '@/pages/pos'
import { RootLayout } from './RootLayout'
import { NotFoundPage, RouteErrorPage } from './RouteFeedback'

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/admin' })
  },
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
})

const adminPage = <TPath extends string>(path: TPath, component: RouteComponent) =>
  createRoute({ getParentRoute: () => adminRoute, path, component })

const docSearch = (search: Record<string, unknown>) => ({
  type: (search.type as string) || undefined,
})

const adminHubRoute = adminPage('/', ModuleHubPage)
const adminStockRoute = adminPage('/stock', StockPage)
const adminSuppliesRoute = adminPage('/supplies', SuppliesPage)
const adminSupplyEditorRoute = adminPage('/supplies/$docId', SupplyEditorPage)
const adminCounterpartiesRoute = adminPage('/counterparties', CounterpartiesPage)
const adminProductsRoute = adminPage('/products', ProductsPage)
const adminProductModelsRoute = adminPage('/product-models', ProductModelsPage)
const adminBrandsRoute = adminPage('/brands', BrandsPage)
const adminProductKindsRoute = adminPage('/kinds', ProductKindsPage)
const adminGiftRulesRoute = adminPage('/gift-rules', GiftRulesPage)
const adminGiftCertificatesRoute = adminPage('/gift-certificates', GiftCertificatesPage)
const adminMovesRoute = adminPage('/moves', MovesPage)
const adminMoveEditorRoute = adminPage('/moves/$docId', MoveEditorPage)
const adminWarehousesRoute = adminPage('/warehouses', WarehousesPage)
const adminSalesRoute = adminPage('/sales', SalesPage)
const adminSaleEditorRoute = adminPage('/sales/$docId', SaleEditorPage)
const adminAdjustmentsRoute = adminPage('/adjustments', AdjustmentsPage)
const adminReturnsRoute = adminPage('/returns', ReturnsPage)
const adminMoneyRoute = adminPage('/money', MoneyPage)
const adminReportsRoute = adminPage('/reports', ReportsPage)
const adminStaffRoute = adminPage('/staff', StaffPage)
const adminShiftsRoute = adminPage('/shifts', ShiftsPage)

const adminAdjustmentEditorRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/adjustments/$docId',
  component: AdjustmentEditorPage,
  validateSearch: docSearch,
})

const adminReturnEditorRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/returns/$docId',
  component: ReturnEditorPage,
  validateSearch: docSearch,
})

// касса живёт внутри каркаса админки (сайдбары, виджеты) и доступна всем ролям
const adminPosRoute = adminPage('/pos', PosPage)

// закладки на /pos ведут в кассу внутри админки
const posRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pos',
  beforeLoad: () => {
    throw redirect({ to: '/admin/pos' })
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  posRedirectRoute,
  adminRoute.addChildren([
    adminPosRoute,
    adminHubRoute,
    adminStockRoute,
    adminSuppliesRoute,
    adminSupplyEditorRoute,
    adminCounterpartiesRoute,
    adminProductsRoute,
    adminProductModelsRoute,
    adminBrandsRoute,
    adminProductKindsRoute,
    adminGiftRulesRoute,
    adminGiftCertificatesRoute,
    adminMovesRoute,
    adminMoveEditorRoute,
    adminWarehousesRoute,
    adminSalesRoute,
    adminSaleEditorRoute,
    adminAdjustmentsRoute,
    adminAdjustmentEditorRoute,
    adminReturnsRoute,
    adminReturnEditorRoute,
    adminMoneyRoute,
    adminReportsRoute,
    adminStaffRoute,
    adminShiftsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
