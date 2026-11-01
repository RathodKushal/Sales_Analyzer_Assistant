import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineChartBarSquare,
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
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: <HiOutlineChartBarSquare />,
      label: 'Overview',
    },
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

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-950/70 backdrop-blur-3xl border-r border-white/10 flex flex-col pt-6 pb-4 z-30 shadow-[4px_0_40px_rgba(0,0,0,0.7)]">
      {/* Top subtle light sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-6 flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/25 via-violet-500/25 to-pink-500/20 border border-white/15 flex items-center justify-center text-cyan-300 shadow-inner shadow-cyan-500/20">
          <HiOutlineCommandLine size={22} />
        </div>
        <div>
          <span className="font-bold tracking-tight text-white block text-sm">ShopFlow CRM</span>
          <span className="text-[10px] bg-gradient-to-r from-cyan-400 via-violet-300 to-pink-400 bg-clip-text text-transparent font-mono tracking-wider block uppercase font-semibold">
            3D Spatial Suite
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          Core Operations
        </div>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/15 backdrop-blur-xl' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-cyan-400 via-violet-400 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                )}
                <span className={`text-[1.15rem] transition-colors ${isActive ? 'text-cyan-400' : 'opacity-75 group-hover:text-cyan-300 group-hover:opacity-100'}`}>
                  {icon}
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-3">
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-semibold tracking-wider text-amber-400/80 uppercase">
              <span>Admin Control</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                PORTAL
              </span>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-amber-500/35 backdrop-blur-xl'
                    : 'text-zinc-400 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                  )}
                  <span className={`text-[1.15rem] transition-colors ${isActive ? 'text-amber-400' : 'opacity-75 group-hover:text-amber-300 group-hover:opacity-100'}`}>
                    <HiOutlineShieldCheck />
                  </span>
                  <span className="truncate">Administration</span>
                </>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer: User + Logout */}
      <div className="px-4 mt-auto pt-3 border-t border-white/5">
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/10 flex items-center gap-3 mb-2 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-cyan-300 shadow-inner">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-zinc-200 truncate">{user?.username || 'User'}</div>
            <div className="text-[11px] text-zinc-400 truncate capitalize">{user?.role || 'viewer'}</div>
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
