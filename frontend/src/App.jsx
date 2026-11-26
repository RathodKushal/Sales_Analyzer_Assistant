import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute, { getHomeDashboardForUser } from './components/RoleRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import DiscountAIPage from './pages/DiscountAIPage';
import ProductHypePage from './pages/ProductHypePage';
import ForecastPage from './pages/ForecastPage';
import DemandPage from './pages/DemandPage';
import DataUploadPage from './pages/DataUploadPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManufacturersDashboardPage from './pages/ManufacturersDashboardPage';
import InventoryDashboardPage from './pages/InventoryDashboardPage';
import PurchaseOrderItemsDashboardPage from './pages/PurchaseOrderItemsDashboardPage';
import QualityInspectionsDashboardPage from './pages/QualityInspectionsDashboardPage';
import BillingPage from './pages/BillingPage';

/**
 * RootRedirect Component
 * Directs each authenticated user strictly to their own home dashboard.
 */
function RootRedirect() {
  const { user } = useAuth();
  const target = getHomeDashboardForUser(user);
  return <Navigate to={target} replace />;
}

/**
 * UserDashboardRoute Component
 * Strictly displays the User Dashboard ONLY to regular users (users, viewer, staff, etc.).
 * If an admin, manufacturer, inventory, purchase manager, or QA inspector visits /dashboard,
 * they are immediately redirected to their own designated dashboard.
 */
function UserDashboardRoute() {
  const { user } = useAuth();
  const home = getHomeDashboardForUser(user);

  if (home !== '/dashboard') {
    return <Navigate to={home} replace />;
  }

  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* 1. Admin ONLY: Accessible exclusively to Admin */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </RoleRoute>
              }
            />

            {/* 2. User ONLY: Accessible exclusively to general database users (users, viewer, etc.) */}
            <Route path="/dashboard" element={<UserDashboardRoute />} />
            <Route path="/dashboard/users" element={<UserDashboardRoute />} />

            {/* 3. Manufacturers ONLY: Accessible exclusively to Manufacturers */}
            <Route
              path="/dashboard/manufacturers"
              element={
                <RoleRoute allowedRoles={['manufacturers', 'manufacturer']}>
                  <ManufacturersDashboardPage />
                </RoleRoute>
              }
            />

            {/* 4. Inventory ONLY: Accessible exclusively to Inventory */}
            <Route
              path="/dashboard/inventory"
              element={
                <RoleRoute allowedRoles={['inventory', 'inventory_manager']}>
                  <InventoryDashboardPage />
                </RoleRoute>
              }
            />

            {/* 5. Purchase Orders ONLY: Accessible exclusively to Purchase Orders */}
            <Route
              path="/dashboard/purchase-orders"
              element={
                <RoleRoute allowedRoles={['purchase_order_items', 'purchase_manager']}>
                  <PurchaseOrderItemsDashboardPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/purchase-order-items"
              element={
                <RoleRoute allowedRoles={['purchase_order_items', 'purchase_manager']}>
                  <PurchaseOrderItemsDashboardPage />
                </RoleRoute>
              }
            />

            {/* 6. Quality Inspections ONLY: Accessible exclusively to Quality QA */}
            <Route
              path="/dashboard/quality-inspections"
              element={
                <RoleRoute allowedRoles={['quality_inspections', 'qa_inspector']}>
                  <QualityInspectionsDashboardPage />
                </RoleRoute>
              }
            />

            {/* Core Domain Operations */}
            <Route
              path="/billing"
              element={
                <RoleRoute allowedRoles={['purchase_order_items', 'purchase_manager', 'purchase_orders', 'purchase', 'sales', 'sales_person']}>
                  <BillingPage />
                </RoleRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <DataUploadPage />
                </RoleRoute>
              }
            />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/discount-ai" element={<DiscountAIPage />} />
            <Route path="/hype-ai" element={<ProductHypePage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/demand" element={<DemandPage />} />

            {/* Root Landing Route — redirects each role strictly to their own dashboard */}
            <Route path="/" element={<RootRedirect />} />
          </Route>
          
          {/* Catch-all — redirects to user's home dashboard */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
