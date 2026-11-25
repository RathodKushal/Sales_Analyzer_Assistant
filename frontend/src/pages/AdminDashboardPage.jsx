import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminAPI, customersAPI } from '../api/client';
import { Card } from '../components/UI';
import {
  HiOutlineShieldCheck,
  HiOutlineBuildingStorefront,
  HiOutlineArchiveBox,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiOutlineUsers,
  HiOutlineServerStack,
  HiOutlineCog6Tooth,
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineUserPlus,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineExclamationTriangle,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineReceiptPercent,
  HiOutlineXMark,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();

  // Active Tab: 'overview' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // State: Metrics
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // State: Users
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // State: Verified Purchasing Customers
  const [customersList, setCustomersList] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // State: Settings
  const [settingsList, setSettingsList] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    is_active: true,
  });
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    role: 'viewer',
    is_active: true,
  });
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // ── Fetch Metrics ──────────────────────────────────────────
  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await adminAPI.getMetrics();
      setMetrics(res.data);
    } catch (err) {
      toast.error('Failed to load system metrics');
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // ── Fetch Users ────────────────────────────────────────────
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (userSearch) params.search = userSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

      const res = await adminAPI.getUsers(params);
      setUsersList(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users list');
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  // ── Fetch Verified Purchasing Customers ─────────────────────
  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await customersAPI.list(0, 200);
      setCustomersList(res.data?.customers || []);
    } catch (err) {
      toast.error('Failed to load customer directory');
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Filtered purchasing customers for Admin search
  const filteredAdminCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customersList;
    const q = customerSearch.toLowerCase().trim();
    return customersList.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const id = String(c.customer_id || '');
      const city = (c.city || '').toLowerCase();
      const state = (c.state || '').toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        id.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    });
  }, [customersList, customerSearch]);

  // ── Fetch Settings ─────────────────────────────────────────
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await adminAPI.getSettings();
      setSettingsList(res.data || []);
      const draft = {};
      res.data.forEach((s) => {
        draft[s.key] = s.value;
      });
      setSettingsDraft(draft);
    } catch (err) {
      toast.error('Failed to load platform settings');
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchCustomers();
    fetchSettings();
  }, []);

  // Reload users when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [userSearch, roleFilter, statusFilter]);

  // ── User Management Actions ────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUserForm);
      toast.success(`User '${newUserForm.username}' created successfully!`);
      setShowAddUserModal(false);
      setNewUserForm({
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        is_active: true,
      });
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleOpenEdit = (targetUser) => {
    setSelectedUser(targetUser);
    setEditUserForm({
      email: targetUser.email,
      role: targetUser.role,
      is_active: targetUser.is_active,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminAPI.updateUser(selectedUser.id, editUserForm);
      toast.success(`User '${selectedUser.username}' updated!`);
      setShowEditUserModal(false);
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleOpenResetPassword = (targetUser) => {
    setSelectedUser(targetUser);
    setResetPasswordValue('');
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminAPI.resetPassword(selectedUser.id, resetPasswordValue);
      toast.success(`Password reset for '${selectedUser.username}'!`);
      setShowResetPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const handleOpenDelete = (targetUser) => {
    setSelectedUser(targetUser);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.deleteUser(selectedUser.id);
      toast.success(`User '${selectedUser.username}' deleted.`);
      setShowDeleteModal(false);
      fetchUsers();
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  // ── Settings Actions ───────────────────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await adminAPI.updateSettings(settingsDraft);
      toast.success('Platform settings saved successfully!');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to update platform settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Reset all platform settings to hardcoded factory defaults?')) return;
    try {
      await adminAPI.resetSettings();
      toast.success('Settings restored to factory defaults');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to reset settings');
    }
  };

  // Grouped settings
  const settingsByCategory = useMemo(() => {
    const map = {};
    settingsList.forEach((item) => {
      const cat = item.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [settingsList]);

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'manager':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'analyst':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-zinc-800/60 text-zinc-300 border-zinc-700/40';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 flex items-center gap-1">
              <HiOutlineShieldCheck className="text-xs" />
              Root Administration
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Systems Nominal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Administration Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Live telemetry, active user governance, role access management, and global platform configuration.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchMetrics();
              fetchUsers();
              fetchSettings();
              toast.success('Telemetry and registry refreshed');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Refresh System Data"
          >
            <HiOutlineArrowPath className={`text-sm ${metricsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all cursor-pointer"
          >
            <HiOutlineUserPlus size={16} />
            Add New User
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-950/60 rounded-2xl border border-white/10 backdrop-blur-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent text-white border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <HiOutlineServerStack className={activeTab === 'overview' ? 'text-amber-400' : ''} />
          System Telemetry & Metrics
        </button>

        <button
          onClick={() => {
            setActiveTab('customers');
            fetchCustomers();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent text-white border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <HiOutlineUsers className={activeTab === 'customers' ? 'text-amber-400' : ''} />
          Purchasing Customers
          {metrics?.business?.total_customers ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
              {metrics.business.total_customers}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent text-white border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <HiOutlineUsers className={activeTab === 'users' ? 'text-amber-400' : ''} />
          Users & Roles Management
          {metrics?.users?.total_users ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-zinc-300 font-mono">
              {metrics.users.total_users}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent text-white border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <HiOutlineAdjustmentsHorizontal className={activeTab === 'settings' ? 'text-amber-400' : ''} />
          Platform Settings
        </button>
      </div>

      {/* ── TAB 1: SYSTEM TELEMETRY & METRICS ──────────────────── */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total & Active Users */}
            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Active Users
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <HiOutlineUsers size={18} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {metricsLoading ? '...' : metrics?.users?.active_users ?? 0}
              </div>
              <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
                <span>Total Registered: <strong className="text-zinc-200">{metrics?.users?.total_users ?? 0}</strong></span>
                <span className="text-emerald-400 font-medium">
                  {metrics?.users?.total_users
                    ? `${Math.round(((metrics?.users?.active_users ?? 0) / metrics.users.total_users) * 100)}% active`
                    : '100%'}
                </span>
              </div>
            </Card>

            {/* Total Orders Volume */}
            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <HiOutlineShoppingCart size={18} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {metricsLoading ? '...' : (metrics?.business?.total_orders ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
                <span>Avg Value: <strong className="text-zinc-200">₹{(metrics?.business?.average_order_value ?? 0).toFixed(0)}</strong></span>
                <span className="text-violet-400 font-medium">{metrics?.business?.total_customers ?? 0} buyers</span>
              </div>
            </Card>

            {/* Total Gross Revenue */}
            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  System Revenue
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <HiOutlineCurrencyRupee size={18} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {metricsLoading ? '...' : `₹${(metrics?.business?.total_revenue ?? 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
                <span>Return Rate: <strong className="text-zinc-200">{(metrics?.business?.return_rate_pct ?? 0)}%</strong></span>
                <span className="text-emerald-400 font-medium">Aggregated</span>
              </div>
            </Card>

            {/* Database & Storage */}
            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Database Footprint
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <HiOutlineCircleStack size={18} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {metricsLoading ? '...' : metrics?.health?.db_size_formatted ?? '0 MB'}
              </div>
              <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
                <span className="truncate">{metrics?.health?.database_type ?? 'SQLite'}</span>
                <span className="text-amber-400 font-mono">v{metrics?.health?.app_version}</span>
              </div>
            </Card>
          </div>

          {/* System Events & Role Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Events & Telemetry Card */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-white/10 text-cyan-300">
                    <HiOutlineClock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Recent System Events</h3>
                    <p className="text-xs text-zinc-400">Live audit log of account registrations and data ingestion</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Live Stream
                </span>
              </div>

              <div className="space-y-2.5">
                {metrics?.activities?.length > 0 ? (
                  metrics.activities.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        <div>
                          <span className="font-semibold text-zinc-100">{act.title}</span>
                          <span className="text-zinc-400 ml-2">{act.description}</span>
                        </div>
                      </div>
                      <span className="text-zinc-500 text-[11px] font-mono">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-500 italic p-3">No system events logged recently.</div>
                )}
              </div>
            </Card>

            {/* Role Breakdown & User Governance Summary */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <HiOutlineShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Role Hierarchy</h3>
                  <p className="text-xs text-zinc-400">Active distribution of user privileges</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {['admin', 'manager', 'analyst', 'viewer'].map((roleKey) => {
                  const count = metrics?.users?.roles_breakdown?.[roleKey] ?? 0;
                  const total = metrics?.users?.total_users || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={roleKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-semibold text-zinc-200">{roleKey}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 font-mono">{count} accounts</span>
                          <span className="text-zinc-500 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            roleKey === 'admin'
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              : roleKey === 'manager'
                              ? 'bg-violet-400'
                              : roleKey === 'analyst'
                              ? 'bg-cyan-400'
                              : 'bg-zinc-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HiOutlineUsers size={14} />
                  Manage User Directory
                </button>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── TAB: PURCHASING CUSTOMERS (ADMIN VIEW) ────────────── */}
      {activeTab === 'customers' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Header & Search Bar Card */}
          <Card className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HiOutlineUsers className="text-amber-400" size={20} />
                  <span>Purchasing Customers Directory</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Showing {filteredAdminCustomers.length} of {customersList.length} verified billing buyers (dummy/unpurchased customers excluded)
                </p>
              </div>

              {/* Live Search Input matching Admin style */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-96">
                  <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, phone, email, or customer ID..."
                    className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      title="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                    >
                      <HiOutlineXMark size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={fetchCustomers}
                  title="Refresh customers list"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
                >
                  <HiOutlineArrowPath className={customersLoading ? 'animate-spin' : ''} size={15} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                  Verified Buyers
                </span>
                <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                  {customersList.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                  Total System Orders
                </span>
                <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                  {customersList.reduce((acc, c) => acc + (c.total_orders || 0), 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                  Total Revenue
                </span>
                <span className="text-lg font-extrabold text-amber-400 font-mono mt-0.5 block">
                  ₹{customersList.reduce((acc, c) => acc + (parseFloat(c.total_spent) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                  Avg Buyer Spend
                </span>
                <span className="text-lg font-extrabold text-zinc-200 font-mono mt-0.5 block">
                  ₹{customersList.length > 0 ? (customersList.reduce((acc, c) => acc + (parseFloat(c.total_spent) || 0), 0) / customersList.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </Card>

          {/* Table Card */}
          <Card className="overflow-hidden">
            {customersLoading ? (
              <div className="py-20 text-center text-zinc-400">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading verified purchasing customers...</p>
              </div>
            ) : customersList.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <HiOutlineUsers size={26} />
                </div>
                <h3 className="text-base font-bold text-zinc-200">No Billed Customers Recorded Yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Customer profiles are recorded automatically when purchases are completed through the POS / Billing system in Purchase Orders.
                </p>
              </div>
            ) : filteredAdminCustomers.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <HiOutlineMagnifyingGlass size={26} />
                </div>
                <h3 className="text-base font-bold text-zinc-200">No Purchasing Customers Found</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  No verified purchasing customers match <span className="text-amber-400 font-semibold font-mono">"{customerSearch}"</span>. Try searching by customer name, phone number, email address, or customer ID.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition cursor-pointer"
                >
                  <HiOutlineXMark size={14} />
                  <span>Clear Search Query</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Contact Details</th>
                      <th className="py-3 px-4 font-semibold text-center">Orders Count</th>
                      <th className="py-3 px-4 font-semibold text-right">Total Spent (₹)</th>
                      <th className="py-3 px-4 font-semibold">Last Purchase Date</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {filteredAdminCustomers.map((c) => {
                      const initials = (c.name || 'C')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      const lastPurchase = c.last_purchase_date
                        ? new Date(c.last_purchase_date).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—';

                      const totalSpent = parseFloat(c.total_spent || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });

                      return (
                        <tr key={c.id || c.customer_id} className="hover:bg-white/[0.04] transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs flex-shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-100 text-xs">
                                  {c.name || `Customer #${c.customer_id}`}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  ID: #{c.customer_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {c.phone ? (
                                <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                                  <HiOutlinePhone className="text-zinc-500" size={13} />
                                  <span>{c.phone}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600 text-[11px]">No phone</span>
                              )}
                              {c.email ? (
                                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                                  <HiOutlineEnvelope className="text-zinc-500" size={13} />
                                  <span className="truncate max-w-[180px]">{c.email}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600 text-[11px]">No email</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono">
                              {c.total_orders || 1} {c.total_orders === 1 ? 'order' : 'orders'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-extrabold text-sm text-white">
                              ₹{totalSpent}
                            </div>
                            {c.avg_order_value > 0 && (
                              <div className="text-[10px] text-zinc-400 font-mono">
                                avg: ₹{parseFloat(c.avg_order_value).toFixed(2)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                              <HiOutlineCalendar className="text-amber-400" size={14} />
                              <span>{lastPurchase}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-zinc-300">{c.city || 'Store Counter'}</div>
                            {c.state && c.state !== c.city && (
                              <div className="text-[10px] text-zinc-500">{c.state}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── TAB 2: USERS & ROLES MANAGEMENT ────────────────────── */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>

              {/* Filter Selectors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <HiOutlineFunnel className="text-zinc-500" />
                  <span>Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-zinc-900/80 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-900/80 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400/50 cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Disabled Only</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/10 cursor-pointer transition-all ml-auto"
                >
                  <HiOutlineUserPlus size={15} />
                  Add User
                </button>
              </div>
            </div>
          </Card>

          {/* User Directory Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-white/10 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading user directory...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => {
                      const isSelf = usr.id === currentUser?.id;
                      return (
                        <tr
                          key={usr.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Username & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center font-bold text-xs text-cyan-300">
                                {usr.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {usr.username}
                                  {isSelf && (
                                    <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-normal border border-cyan-500/30">
                                      YOU
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  ID #{usr.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 text-zinc-300 font-mono">
                            {usr.email}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${getRoleBadge(
                                usr.role
                              )}`}
                            >
                              {usr.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {usr.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Disabled
                              </span>
                            )}
                          </td>

                          {/* Last Login */}
                          <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
                            {usr.last_login
                              ? new Date(usr.last_login).toLocaleDateString() +
                                ' ' +
                                new Date(usr.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Never'}
                          </td>

                          {/* Created At */}
                          <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
                            {usr.created_at
                              ? new Date(usr.created_at).toLocaleDateString()
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(usr)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                                title="Edit Role & Status"
                              >
                                <HiOutlinePencilSquare size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenResetPassword(usr)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-amber-300 transition-all cursor-pointer"
                                title="Reset Password"
                              >
                                <HiOutlineKey size={16} />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => handleOpenDelete(usr)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                                  title="Delete Account"
                                >
                                  <HiOutlineTrash size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── TAB 3: PLATFORM SETTINGS ───────────────────────────── */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Platform Settings & Control Parameters</h3>
              <p className="text-xs text-zinc-400">Modify global system behavior, AI inference limits, and security protocols.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetSettings}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer"
              >
                Restore Defaults
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {settingsLoading ? (
            <div className="p-12 text-center text-zinc-500">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading system settings...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(settingsByCategory).map(([category, items]) => (
                <Card key={category} className="p-6">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{category} Configuration</h4>
                  </div>

                  <div className="space-y-4">
                    {items.map((setting) => {
                      const isBool = setting.value === 'true' || setting.value === 'false';
                      const currentValue = settingsDraft[setting.key] ?? setting.value;

                      return (
                        <div key={setting.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-300 font-mono">
                              {setting.key}
                            </label>
                            {isBool && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((prev) => ({
                                    ...prev,
                                    [setting.key]: prev[setting.key] === 'true' ? 'false' : 'true',
                                  }))
                                }
                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                                  currentValue === 'true' ? 'bg-amber-500' : 'bg-zinc-800'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    currentValue === 'true' ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {!isBool && (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) =>
                                setSettingsDraft((prev) => ({
                                  ...prev,
                                  [setting.key]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 transition-all font-mono"
                            />
                          )}

                          {setting.description && (
                            <p className="text-[11px] text-zinc-500 leading-tight">
                              {setting.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── MODAL: ADD USER ────────────────────────────────────── */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <HiOutlineUserPlus className="text-amber-400 text-lg" />
                  <h3 className="text-base font-bold text-white">Create New Account</h3>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <HiOutlineXCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jdoe@shopflow.ai"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Initial Status</label>
                    <select
                      value={newUserForm.is_active ? 'true' : 'false'}
                      onChange={(e) => setNewUserForm({ ...newUserForm, is_active: e.target.value === 'true' })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold cursor-pointer transition-all"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: EDIT USER ────────────────────────────────────── */}
      <AnimatePresence>
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <HiOutlinePencilSquare className="text-cyan-400 text-lg" />
                  <h3 className="text-base font-bold text-white">Edit User: {selectedUser.username}</h3>
                </div>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <HiOutlineXCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    disabled={selectedUser.id === currentUser?.id}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  {selectedUser.id === currentUser?.id && (
                    <p className="text-[11px] text-amber-400/80 mt-1">You cannot demote your own account.</p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Account Status</label>
                  <select
                    value={editUserForm.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.value === 'true' })}
                    disabled={selectedUser.id === currentUser?.id}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 disabled:opacity-50"
                  >
                    <option value="true">Active</option>
                    <option value="false">Disabled (Prevent Login)</option>
                  </select>
                  {selectedUser.id === currentUser?.id && (
                    <p className="text-[11px] text-amber-400/80 mt-1">You cannot deactivate your own account.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold cursor-pointer transition-all"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: RESET PASSWORD ───────────────────────────────── */}
      <AnimatePresence>
        {showResetPasswordModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <HiOutlineKey className="text-amber-400 text-lg" />
                  <h3 className="text-base font-bold text-white">Reset Password: {selectedUser.username}</h3>
                </div>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <HiOutlineXCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400/50"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Must be at least 6 characters long.</p>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold cursor-pointer transition-all"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: DELETE CONFIRMATION ──────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-zinc-950 border border-rose-500/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <HiOutlineExclamationTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete User</h3>
                  <p className="text-xs text-zinc-400">Irreversible operation</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300">
                Are you sure you want to permanently delete user{' '}
                <strong className="text-white">'{selectedUser.username}'</strong> ({selectedUser.email})?
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white cursor-pointer transition-all shadow-md shadow-rose-500/20"
                >
                  Yes, Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
