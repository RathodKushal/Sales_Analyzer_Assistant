import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineArrowTrendingUp,
  HiOutlinePresentationChartBar,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCommandLine,
  HiOutlineCloudArrowUp,
  HiOutlineShieldCheck,
  HiOutlineBuildingStorefront,
  HiOutlineArchiveBox,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiOutlineReceiptPercent,
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = (user?.role || '').toLowerCase();
  const userName = (user?.username || '').toLowerCase();

  /**
   * Determine the single authorized dashboard for the currently logged-in user:
   * - Admin shows ONLY the Admin dashboard (/admin)
   * - Users/General DB users show ONLY the User dashboard (/dashboard)
   * - Manufacturers show ONLY the Manufacturer dashboard (/dashboard/manufacturers)
   * - Inventory shows ONLY the Inventory dashboard (/dashboard/inventory)
   * - Purchase Orders show ONLY the Purchase Orders dashboard (/dashboard/purchase-orders)
   * - Quality QA shows ONLY the Quality Assurance dashboard (/dashboard/quality-inspections)
   */
  const getSingleAuthorizedPortal = () => {
    if (userRole === 'admin' || userName === 'admin') {
      return {
        to: '/admin',
        icon: <HiOutlineShieldCheck />,
        label: 'Admin Console',
        categoryTag: 'ADMINISTRATOR',
        color: 'text-amber-400',
        activeGradient: 'from-amber-500/20 via-orange-500/15 to-transparent',
        borderColor: 'border-amber-500/35',
        barColor: 'from-amber-400 to-orange-500',
      };
    }

    if (userRole === 'manufacturers' || userRole === 'manufacturer' || userName === 'manufacturers') {
      return {
        to: '/dashboard/manufacturers',
        icon: <HiOutlineBuildingStorefront />,
        label: 'Manufacturer Portal',
        categoryTag: 'MANUFACTURER',
        color: 'text-emerald-400',
        activeGradient: 'from-emerald-500/20 via-teal-500/15 to-transparent',
        borderColor: 'border-emerald-500/35',
        barColor: 'from-emerald-400 to-teal-500',
      };
    }

    if (userRole === 'inventory' || userRole === 'inventory_manager' || userName === 'inventory') {
      return {
        to: '/dashboard/inventory',
        icon: <HiOutlineCube />,
        label: 'Inventory',
        categoryTag: 'INVENTORY',
        color: 'text-orange-400',
        activeGradient: 'from-orange-500/20 via-amber-500/15 to-transparent',
        borderColor: 'border-orange-500/35',
        barColor: 'from-orange-400 to-amber-500',
      };
    }

    if (userRole === 'purchase_order_items' || userRole === 'purchase_manager' || userName === 'purchase_order_items') {
      return {
        to: '/dashboard/purchase-orders',
        icon: <HiOutlineDocumentCheck />,
        label: 'Purchase Orders',
        categoryTag: 'PURCHASE',
        color: 'text-indigo-400',
        activeGradient: 'from-indigo-500/20 via-purple-500/15 to-transparent',
        borderColor: 'border-indigo-500/35',
        barColor: 'from-indigo-400 to-purple-500',
      };
    }

    if (userRole === 'quality_inspections' || userRole === 'qa_inspector' || userName === 'quality_inspections') {
      return {
        to: '/dashboard/quality-inspections',
        icon: <HiOutlineCheckBadge />,
        label: 'Quality Assurance',
        categoryTag: 'QA INSPECTION',
        color: 'text-rose-400',
        activeGradient: 'from-rose-500/20 via-pink-500/15 to-transparent',
        borderColor: 'border-rose-500/35',
        barColor: 'from-rose-400 to-pink-500',
      };
    }

    // Default for 'users' and any other user in the database
    return {
      to: '/dashboard',
      icon: <HiOutlineUsers />,
      label: 'User Dashboard',
      categoryTag: 'USER WORKSPACE',
      color: 'text-cyan-400',
      activeGradient: 'from-cyan-500/20 via-blue-500/15 to-transparent',
      borderColor: 'border-cyan-500/35',
      barColor: 'from-cyan-400 to-blue-500',
    };
  };

  const portal = getSingleAuthorizedPortal();

  const coreOperations = [
    {
      to: '/upload',
      icon: <HiOutlineCloudArrowUp />,
      label: 'Upload Dataset',
    },
    {
      to: '/customers',
      icon: <HiOutlineUsers />,
      label: 'Customers',
    },
    {
      to: '/orders',
      icon: <HiOutlineShoppingCart />,
      label: 'Orders',
    },
    {
      to: '/products',
      icon: <HiOutlineCube />,
      label: 'Products',
    },
    {
      to: '/discount-ai',
      icon: <HiOutlineSparkles />,
      label: 'Discount AI',
    },
    {
      to: '/hype-ai',
      icon: <HiOutlineFire />,
      label: 'Hype AI',
    },
    {
      to: '/forecast',
      icon: <HiOutlineArrowTrendingUp />,
      label: 'Sales Forecast',
    },
    {
      to: '/demand',
      icon: <HiOutlinePresentationChartBar />,
      label: 'Demand Analysis',
    },
  ];

  /**
   * Platform Tools visibility per role / portal:
   * - Admin: ONLY Customers, Products, Sales Forecast
   * - Manufacturer Portal: REMOVE ALL platform tools
   * - Inventory Control: REMOVE ALL platform tools
   * - Purchase Orders: REMOVE ALL platform tools
   * - Quality Inspection: REMOVE ALL platform tools
   * - Regular user workspace: Core operations
   */
  const getVisiblePlatformTools = () => {
    const path = location.pathname;

    const isAdmin =
      userRole === 'admin' || userName === 'admin' || path === '/admin';
    const isManufacturer =
      userRole === 'manufacturers' ||
      userRole === 'manufacturer' ||
      userName === 'manufacturers' ||
      path.startsWith('/dashboard/manufacturers');
    const isInventory =
      userRole === 'inventory' ||
      userRole === 'inventory_manager' ||
      userName === 'inventory' ||
      path.startsWith('/dashboard/inventory');
    const isPurchase =
      userRole === 'purchase_order_items' ||
      userRole === 'purchase_manager' ||
      userName === 'purchase_order_items' ||
      path.startsWith('/dashboard/purchase-order');
    const isQuality =
      userRole === 'quality_inspections' ||
      userRole === 'qa_inspector' ||
      userName === 'quality_inspections' ||
      path.startsWith('/dashboard/quality-inspections');

    if (isAdmin) {
      return [
        {
          to: '/customers',
          icon: <HiOutlineUsers />,
          label: 'Customers',
        },
        {
          to: '/products',
          icon: <HiOutlineCube />,
          label: 'Products',
        },
        {
          to: '/forecast',
          icon: <HiOutlineArrowTrendingUp />,
          label: 'Sales Forecast',
        },
      ];
    }

    if (isPurchase) {
      return [
        {
          to: '/billing',
          icon: <HiOutlineReceiptPercent />,
          label: 'Billing / POS',
        },
      ];
    }

    if (isManufacturer || isInventory || isQuality) {
      return [];
    }

    return coreOperations;
  };

  const visibleTools = getVisiblePlatformTools();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-950/70 backdrop-blur-3xl border-r border-white/10 flex flex-col pt-6 pb-4 z-30 shadow-[4px_0_40px_rgba(0,0,0,0.7)]">
      {/* Top subtle light sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-6 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/25 via-violet-500/25 to-pink-500/20 border border-white/15 flex items-center justify-center text-cyan-300 shadow-inner shadow-cyan-500/20">
          <HiOutlineCommandLine size={22} />
        </div>
        <div>
          <span className="font-bold tracking-tight text-white block text-sm">ShopFlow CRM</span>
          <span className="text-[10px] bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 bg-clip-text text-transparent font-mono tracking-wider block uppercase font-semibold">
            Unified Suite
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
        {/* Dedicated Authorized Dashboard (ONLY 1 single dashboard shown) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            <span>My Dashboard</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-zinc-300 font-mono border border-white/10">
              {portal.categoryTag}
            </span>
          </div>

          <NavLink
            to={portal.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? `bg-gradient-to-r ${portal.activeGradient} text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border ${portal.borderColor} backdrop-blur-xl`
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b ${portal.barColor} shadow-[0_0_12px_rgba(6,182,212,0.8)]`}
                  />
                )}
                <span
                  className={`text-lg transition-colors ${
                    isActive
                      ? portal.color
                      : 'opacity-75 group-hover:opacity-100 group-hover:' + portal.color
                  }`}
                >
                  {portal.icon}
                </span>
                <span className="truncate flex-1 font-bold">{portal.label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </>
            )}
          </NavLink>
        </div>

        {/* Core Operations / Platform Tools */}
        {visibleTools.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Platform Tools
            </div>
            <div className="space-y-1">
              {visibleTools.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/15 backdrop-blur-xl'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-gradient-to-b from-cyan-400 via-violet-400 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                      )}
                      <span
                        className={`text-base transition-colors ${
                          isActive
                            ? 'text-cyan-400'
                            : 'opacity-75 group-hover:text-cyan-300 group-hover:opacity-100'
                        }`}
                      >
                        {icon}
                      </span>
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer: User Profile + Logout */}
      <div className="px-4 mt-auto pt-3 border-t border-white/5">
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/10 flex items-center gap-3 mb-2 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-cyan-300 shadow-inner">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-zinc-200 truncate">
              {user?.username || 'User'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate capitalize">
              Role: {user?.role || 'viewer'}
            </div>
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          onClick={handleLogout}
        >
          <HiOutlineArrowRightOnRectangle size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
