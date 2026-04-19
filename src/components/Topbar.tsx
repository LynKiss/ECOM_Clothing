import { Search, Bell, Globe, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-surface/80 backdrop-blur-xl border-b border-on-surface-variant/5 z-40 flex items-center justify-between px-10">
      <div className="flex items-center gap-8 flex-1">
        <h2 className="text-xl font-black text-primary tracking-tight">Harvest OS</h2>
        
        <div className="relative w-full max-w-md hidden lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="w-full bg-on-surface-variant/5 border-none rounded-full py-2.5 pl-12 pr-6 focus:ring-2 focus:ring-primary/20 text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 mr-4">
          <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Analytics</a>
          <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Logistics</a>
        </nav>

        <div className="flex items-center gap-4 text-on-surface-variant/80 border-l border-on-surface-variant/10 pl-6">
          <button className="hover:text-primary transition-colors relative p-1">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
          </button>
          <button className="hover:text-primary transition-colors p-1">
            <Globe size={20} />
          </button>
          <button className="hover:text-primary transition-colors p-1">
            <User size={20} />
          </button>
        </div>

        <button className="bg-gradient-to-r from-primary to-primary-container text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
          Deploy Update
        </button>
      </div>
    </header>
  );
}
