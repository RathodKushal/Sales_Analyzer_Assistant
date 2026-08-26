/**
 * Sidebar — Navigation Sidebar
 * ================================
 * Persistent sidebar with navigation links,
 * user profile, and logout button.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineChartBarSquare,
  HiOutlineShoppingCart,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCpuChip,
  HiOutlineDocumentArrowUp,
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
      label: 'Dashboard',
    },
    {
      to: '/document-analysis',
      icon: <HiOutlineDocumentArrowUp />,
      label: 'Data Ingestion',
    },
    {
      to: '/reports',
      icon: <HiOutlineDocumentText />,
      label: 'Reports',
    },
    {
      to: '/social',
      icon: <HiOutlineSparkles />,
      label: 'Social Media AI',
    },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <HiOutlineCpuChip />
        </div>
        <span className="sidebar__logo-text">Sales Analyzer</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <span className="sidebar__section-label">Main Menu</span>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: User + Logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.username || 'User'}</div>
            <div className="sidebar__user-role">{user?.role || 'viewer'}</div>
          </div>
        </div>
        <button
          className="btn btn--ghost"
          onClick={handleLogout}
          style={{ width: '100%', marginTop: 8, justifyContent: 'flex-start' }}
        >
          <HiOutlineArrowRightOnRectangle />
          Logout
        </button>
      </div>
    </aside>
  );
}
