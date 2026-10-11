import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';

export default function MainLayout() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/subjects');

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 text-surface-900 font-sans">
      <TopNav />
      <div className="flex-1 flex flex-col items-center min-w-0 bg-[#F9FAFB]">
        <main
          className={`w-full max-w-[1400px] flex-1 flex flex-col min-h-0 ${
            isWorkspace ? '' : 'overflow-y-auto p-6 md:p-8 md:pt-10'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
