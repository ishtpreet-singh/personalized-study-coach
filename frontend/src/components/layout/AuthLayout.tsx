import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-100/50 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow-primary">
              <span className="text-xl text-white">🎓</span>
            </div>
            <span className="font-display font-bold text-2xl text-surface-900 tracking-tight">Study Coach</span>
          </div>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
}
