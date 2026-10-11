import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Calendar, CheckSquare, BarChart2, User, LogOut,
  ChevronDown, Settings, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const firstName = user?.full_name?.split(' ')[0] || 'Profile';

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
      active
        ? 'bg-primary-50 text-primary-700'
        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
    );

  const NAV_ITEMS = [
    {
      label: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      active: pathname.startsWith('/calendar'),
      soon: false,
    },
    {
      label: 'Planner',
      icon: CheckSquare,
      path: '/planner',
      active: pathname.startsWith('/planner'),
      soon: true,
    },
    {
      label: 'Analytics',
      icon: BarChart2,
      path: '/dashboard', // global analytics lives on dashboard for now
      active: false,
      soon: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-surface-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Left: Logo ── */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
            <span className="text-sm text-white">🎓</span>
          </div>
          <span className="font-display font-bold text-lg text-surface-900 tracking-tight hidden sm:block">
            Study Coach
          </span>
        </Link>

        {/* ── Desktop Right Nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.soon ? (
              <span
                key={item.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-surface-400 cursor-not-allowed select-none"
                title="Coming soon"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-100 text-primary-500 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              </span>
            ) : (
              <NavLink
                key={item.label}
                to={item.path}
                className={navLinkClass(item.active)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-surface-200 mx-2" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                profileOpen
                  ? 'bg-surface-100 text-surface-900'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              )}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={firstName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary-600" />
                </div>
              )}
              <span>{firstName}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  profileOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-surface-200 rounded-xl shadow-lg py-1 z-50">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            )}
          </div>

          {/* Standalone Logout — NOT inside profile dropdown */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-surface-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </nav>

        {/* ── Mobile Hamburger ── */}
        <button
          className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Menu Panel ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) =>
            item.soon ? (
              <span
                key={item.label}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-surface-400 cursor-not-allowed"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-100 text-primary-500 px-1.5 py-0.5 rounded-full ml-auto">
                  Soon
                </span>
              </span>
            ) : (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-700 hover:bg-surface-50'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          )}

          <div className="border-t border-surface-100 pt-2 mt-2 space-y-1">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <User className="w-4 h-4" />
              View Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
