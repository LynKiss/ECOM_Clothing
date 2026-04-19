import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/app.layout';
import AdminLayout from '../layouts/admin.layout';
import ClientLayout from '../layouts/client.layout';
import NotFound from '../components/shared/NotFound';
import ProtectedAdminRoute from '../components/shared/ProtectedAdminRoute';
import { ROUTE_PATHS } from './route-names';

const DashboardPage = lazy(() => import('../features/admin/dashboard/page'));
const ProductsPage = lazy(() => import('../features/admin/products/page'));
const OrdersPage = lazy(() => import('../features/admin/orders/page'));
const CustomersPage = lazy(() => import('../features/admin/customers/page'));
const ReportsPage = lazy(() => import('../features/admin/reports/page'));
const InterfacePage = lazy(() => import('../features/admin/interface/page'));
const SecurityPage = lazy(() => import('../features/admin/security/page'));
const SettingsPage = lazy(() => import('../features/admin/settings/page'));
const ClientHomePage = lazy(() => import('../features/client/home/page'));
const LoginPage = lazy(() => import('../pages/Login'));

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<div className="p-6 text-sm text-on-surface-variant">Loading...</div>}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.root,
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Navigate to={ROUTE_PATHS.admin} replace /> },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: withSuspense(<DashboardPage />) },
              { path: 'products', element: withSuspense(<ProductsPage />) },
              { path: 'orders', element: withSuspense(<OrdersPage />) },
              { path: 'customers', element: withSuspense(<CustomersPage />) },
              { path: 'reports', element: withSuspense(<ReportsPage />) },
              { path: 'interface', element: withSuspense(<InterfacePage />) },
              { path: 'security', element: withSuspense(<SecurityPage />) },
              { path: 'settings', element: withSuspense(<SettingsPage />) },
            ],
          },
        ],
      },
      {
        path: 'client',
        element: <ClientLayout />,
        children: [{ index: true, element: withSuspense(<ClientHomePage />) }],
      },
      { path: 'login', element: withSuspense(<LoginPage />) },
    ],
  },
]);
