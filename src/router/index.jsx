import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import KDSLayout from '@/components/layout/KDSLayout'
import LoginPage from '@/pages/auth/LoginPage'
import HelpPage from '@/pages/auth/HelpPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import TablesPage from '@/pages/tables/TablesPage'
import POSPage from '@/pages/pos/POSPage'
import KitchenPage from '@/pages/kitchen/KitchenPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import OrderDetailPage from '@/pages/orders/OrderDetailPage'
import StockPage from '@/pages/stock/StockPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import DeliveriesPage from '@/pages/deliveries/DeliveriesPage'
import UsersPage from '@/pages/users/UsersPage'
import ProductsPage from '@/pages/products/ProductsPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import CancellationsPage from '@/pages/cancellations/CancellationsPage'
import AuditPage from '@/pages/audit/AuditPage'
import PublicMenuPage from '@/pages/menu/PublicMenuPage'
import QrCodesPage from '@/pages/tables/QrCodesPage'
import WaiterHomePage from '@/pages/mobile/WaiterHomePage'
import MobileOrderPage from '@/pages/mobile/MobileOrderPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import CashSessionPage from '@/pages/cash-sessions/CashSessionPage'
import TabsPage from '@/pages/tabs/TabsPage'
import TabDetailPage from '@/pages/tabs/TabDetailPage'
import CakeOrdersPage from '@/pages/cakes/CakeOrdersPage'
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage'

export const router = createBrowserRouter([
  // Public
  { path: '/login',       element: <LoginPage /> },
  { path: '/doc',         element: <HelpPage /> },
  { path: '/menu/:slug',  element: <PublicMenuPage /> },
  { path: '/',           element: <PublicMenuPage /> },

  // KDS full screen
  {
    element: <KDSLayout />,
    children: [
      { path: '/kitchen', element: <KitchenPage /> },
    ],
  },

  // App protégée
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard',     element: <DashboardPage /> },
      { path: '/analytics',     element: <AnalyticsPage /> },
      { path: '/cash',          element: <CashSessionPage /> },
      { path: '/tables',        element: <TablesPage /> },
      { path: '/tables/qr',     element: <QrCodesPage /> },
      { path: '/pos',           element: <POSPage /> },
      { path: '/orders',        element: <OrdersPage /> },
      { path: '/orders/:id',    element: <OrderDetailPage /> },
      { path: '/stock',         element: <StockPage /> },
      { path: '/reports',       element: <ReportsPage /> },
      { path: '/deliveries',    element: <DeliveriesPage /> },
      { path: '/users',         element: <UsersPage /> },
      { path: '/products',      element: <ProductsPage /> },
      { path: '/categories',    element: <CategoriesPage /> },
      { path: '/settings',      element: <SettingsPage /> },
      { path: '/cancellations', element: <CancellationsPage /> },
      { path: '/audit',         element: <AuditPage /> },
      { path: '/mobile',        element: <WaiterHomePage /> },
      { path: '/mobile/order',  element: <MobileOrderPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/tabs',          element: <TabsPage /> },
      { path: '/tabs/:id',      element: <TabDetailPage /> },
      { path: '/cakes',         element: <CakeOrdersPage /> },
    ],
  },
])
