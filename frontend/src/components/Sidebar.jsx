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
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout } = useAuth();
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
    <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col pt-6 pb-4">
      {/* Logo */}
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-md bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
          <HiOutlineCommandLine size={18} />
        </div>
        <span className="font-semibold tracking-tight text-zinc-100">ShopFlow CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="px-3 mb-2 text-[10.5px] font-medium tracking-wider text-zinc-500 uppercase">Core Operations</div>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-zinc-800/80 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
              }`
            }
          >
            <span className="text-[1.1rem] opacity-80">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: User + Logout */}
      <div className="px-4 mt-auto">
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-zinc-200 truncate">{user?.username || 'User'}</div>
            <div className="text-xs text-zinc-500 truncate">{user?.role || 'viewer'}</div>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
          onClick={handleLogout}
        >
          <HiOutlineArrowRightOnRectangle size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
