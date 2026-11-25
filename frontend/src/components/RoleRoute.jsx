/**
 * RoleRoute — Strict Role-Based Route Isolation Component
 * =======================================================
 * Enforces strict 1-to-1 dashboard isolation:
 * - Admin ONLY accesses Admin (/admin)
 * - User ONLY accesses User Dashboard (/dashboard)
 * - Manufacturers ONLY accesses Manufacturers (/dashboard/manufacturers)
 * - Inventory ONLY accesses Inventory (/dashboard/inventory)
 * - Purchase Orders ONLY accesses Purchase Orders (/dashboard/purchase-orders)
 * - Quality QA ONLY accesses Quality QA (/dashboard/quality-inspections)
 *
 * If any user attempts to navigate to a dashboard outside their role,
 * they are blocked and redirected strictly to their own authorized dashboard.
 */

import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function getHomeDashboardForUser(user) {
  const role = (user?.role || '').toLowerCase();
  const username = (user?.username || '').toLowerCase();

  if (role === 'admin' || username === 'admin') {
    return '/admin';
  }
  if (role === 'manufacturers' || role === 'manufacturer' || username === 'manufacturers') {
    return '/dashboard/manufacturers';
  }
  if (role === 'inventory' || role === 'inventory_manager' || username === 'inventory') {
    return '/dashboard/inventory';
  }
  if (role === 'purchase_order_items' || role === 'purchase_manager' || username === 'purchase_order_items') {
    return '/dashboard/purchase-orders';
  }
  if (role === 'quality_inspections' || role === 'qa_inspector' || username === 'quality_inspections') {
    return '/dashboard/quality-inspections';
  }
  // Any other person from the user database gets the User Dashboard
  return '/dashboard';
}

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const hasNotified = useRef(false);

  const role = (user?.role || '').toLowerCase();
  const username = (user?.username || '').toLowerCase();

  // Strict matching: Only users with matching role/username are authorized
  const isAuthorized =
    allowedRoles.map((r) => r.toLowerCase()).includes(role) ||
    allowedRoles.map((r) => r.toLowerCase()).includes(username);

  const homePath = getHomeDashboardForUser(user);

  useEffect(() => {
    if (!loading && isAuthenticated && !isAuthorized && !hasNotified.current) {
      toast.error('Access restricted: You can only view your own authorized dashboard.');
      hasNotified.current = true;
    }
  }, [loading, isAuthenticated, isAuthorized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
