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
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          <HelpCircle className="w-4 h-4" />
          Need help?
        </a>
      </header>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large curved shape on bottom-left */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[80%] rounded-full bg-primary-50/80 blur-3xl" />
        
        {/* Subtle dot pattern on right */}
        <div 
          className="absolute top-[20%] -right-12 w-64 h-96 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(#6366f1 2px, transparent 2px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 w-full p-4 sm:p-6 lg:p-8 mt-16">
        <div className="w-full max-w-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
