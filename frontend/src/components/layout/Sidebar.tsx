import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bot, BrainCircuit, Calendar, CheckSquare, Settings, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Documents', icon: FileText, path: '/documents' },
  { label: 'AI Tutor', icon: Bot, path: '/tutor' },
  { label: 'Quizzes', icon: CheckSquare, path: '/quizzes' },
  { label: 'Weak Topics', icon: BrainCircuit, path: '/weak-topics' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 border-r border-surface-200 bg-surface-50 flex flex-col hidden md:flex h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-sm text-white">🎓</span>
          </div>
          <span className="font-display font-bold text-lg text-surface-900 tracking-tight">Study Coach</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 px-3 mt-4">
          Learning
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary-50 text-primary-700" 
                : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-surface-200 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
