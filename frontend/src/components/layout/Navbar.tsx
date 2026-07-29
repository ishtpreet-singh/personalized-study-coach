import { Bell, Search } from 'lucide-react';

export function Navbar() {
  return (
    <header className="h-16 border-b border-surface-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text" 
            placeholder="Search documents, topics..." 
            className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 text-surface-500 hover:text-surface-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 text-white flex items-center justify-center font-semibold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
          S
        </div>
      </div>
    </header>
  );
}
