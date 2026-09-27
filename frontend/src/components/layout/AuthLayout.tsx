import { Outlet, Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] relative flex flex-col font-sans text-surface-900">
      {/* Top Navbar */}
      <header className="absolute top-0 w-full flex items-center justify-between px-6 py-4 md:px-12 z-20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-sm text-white">🎓</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-surface-900">Study Coach</span>
        </Link>
        <Link to="/help" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1">
          <HelpCircle className="w-4 h-4" />
          Need help?
        </Link>
      </header>

      {/* Decorative Background Elements Removed for SaaS aesthetic */}
      
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 w-full p-4 sm:p-6 lg:p-8 mt-16">
        <div className="w-full max-w-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
