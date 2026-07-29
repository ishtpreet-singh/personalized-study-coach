import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export default function MainLayout() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/tutor');

  return (
    <div className="h-screen flex bg-surface-50 text-surface-900 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className={`flex-1 flex flex-col min-h-0 ${isChat ? '' : 'overflow-y-auto p-6 md:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
