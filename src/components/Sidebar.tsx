import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  MonitorSmartphone, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Sidebar() {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/admin/customers' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { id: 'interface', label: 'Interface', icon: MonitorSmartphone, path: '/admin/interface' },
    { id: 'security', label: 'Security', icon: ShieldCheck, path: '/admin/security' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-bg flex flex-col p-6 z-50 shadow-2xl">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">
          Cultivated Ledger
        </h1>
        <p className="text-accent/60 text-xs mt-1 font-medium">Admin Terminal</p>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 text-sm font-medium
              ${isActive 
                ? 'bg-accent text-primary font-bold shadow-lg shadow-accent/20 scale-100' 
                : 'text-white/60 hover:text-white hover:bg-white/5 active:scale-95'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-accent font-bold">
            AD
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Administrator</p>
            <p className="text-white/40 text-xs">v2.4.1</p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white transition-colors text-sm font-medium">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
