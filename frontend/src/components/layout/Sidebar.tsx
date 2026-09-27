import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Bot, Calendar, CheckSquare, BrainCircuit, Settings, LogOut, ChevronRight, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // Extract subjectId if we are in a subject workspace
  const subjectMatch = pathname.match(/^\/subjects\/([^\/]+)/);
  const currentSubjectId = subjectMatch ? subjectMatch[1] : null;

  const NAV_ITEMS = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      isActive: pathname === '/dashboard' || pathname === '/'
    },
    { 
      label: 'Subjects', 
      icon: BookOpen, 
      path: '/dashboard', // Dashboard acts as the subjects index
      isActive: pathname.startsWith('/subjects') && !pathname.includes('/tutor') && !pathname.includes('/analytics')
    },
    { 
      label: 'AI Tutor', 
      icon: Bot, 
      path: currentSubjectId ? `/subjects/${currentSubjectId}/tutor` : '/dashboard',
      isActive: pathname.includes('/tutor')
    },
    { 
      label: 'Calendar', 
      icon: Calendar, 
      path: '/calendar',
      isActive: pathname.startsWith('/calendar')
    },
    { 
      label: 'Planner', 
      icon: CheckSquare, 
      path: '/planner', 
      badge: 'Soon',
      isActive: pathname.startsWith('/planner')
    },
    { 
      label: 'Analytics', 
      icon: BrainCircuit, 
      path: currentSubjectId ? `/subjects/${currentSubjectId}/analytics` : '/dashboard',
      isActive: pathname.includes('/analytics')
    },
  ];

  return (
    <aside className="w-64 bg-[#141521] border-r border-[#202136] flex-col hidden md:flex h-screen sticky top-0 text-surface-200">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-sm text-white">🎓</span>
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Study Coach</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all group",
              item.isActive 
                ? "bg-primary-500/15 text-white shadow-sm border border-primary-500/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3.5">
              <item.icon className="w-5 h-5" />
              {item.label}
            </div>
            {item.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 space-y-1.5">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all",
            pathname.startsWith('/settings')
              ? "bg-primary-500/15 text-white shadow-sm border border-primary-500/20" 
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <Link to="/settings" className="mt-6 p-4 bg-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all border border-white/5 shadow-sm group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-white leading-tight">
                {user?.full_name?.split(' ')[0] || 'Student'}
              </p>
              <p className="text-[13px] font-medium text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors">View Profile</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
