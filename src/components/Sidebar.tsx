import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MonitorSmartphone,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAdminSession } from '../hooks/useAdminSession';
import { useToast } from '../hooks/useToast';
import { logoutAdmin } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { session } = useAdminSession();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const isVietnamese = language === 'vi';

  const navItems = [
    { id: 'dashboard', label: isVietnamese ? 'Tổng quan' : 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'products', label: isVietnamese ? 'Sản phẩm' : 'Products', icon: Package, path: '/admin/products' },
    { id: 'categories', label: isVietnamese ? 'Danh mục' : 'Categories', icon: FolderTree, path: '/admin/categories' },
    { id: 'orders', label: isVietnamese ? 'Đơn hàng' : 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'customers', label: isVietnamese ? 'Tài khoản' : 'Customers', icon: Users, path: '/admin/customers' },
    { id: 'reports', label: isVietnamese ? 'Báo cáo' : 'Reports', icon: BarChart3, path: '/admin/reports' },
    { id: 'interface', label: isVietnamese ? 'Giao diện' : 'Interface', icon: MonitorSmartphone, path: '/admin/interface' },
    { id: 'security', label: isVietnamese ? 'Bảo mật' : 'Security', icon: ShieldCheck, path: '/admin/security' },
    { id: 'settings', label: isVietnamese ? 'Cấu hình' : 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logoutAdmin();
      showToast({
        tone: 'info',
        title: isVietnamese ? 'Đã đăng xuất' : 'Signed out',
        description: isVietnamese
          ? 'Phiên quản trị đã được đóng an toàn.'
          : 'The admin session has been closed safely.',
      });
      onClose();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = session?.user.username || (isVietnamese ? 'Quản trị viên' : 'Administrator');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <>
      <button
        type="button"
        aria-label={isVietnamese ? 'Đóng thanh điều hướng' : 'Close navigation'}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden bg-sidebar-bg p-6 shadow-2xl transition-transform duration-300 lg:w-64 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-4 px-4 lg:mb-10">
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">Cultivated Ledger</h1>
            <p className="mt-1 text-xs font-medium text-accent/60">
              {isVietnamese ? 'Bảng điều khiển quản trị' : 'Administrative console'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-accent text-primary font-bold shadow-lg shadow-accent/20 scale-100'
                      : 'text-white/60 hover:bg-white/5 hover:text-white active:scale-95'
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/20 font-bold text-accent">
                {initials || 'AD'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-white/40">{session?.user.email || (isVietnamese ? 'phiên quản trị' : 'admin session')}</p>
              </div>
            </div>

            <button
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white disabled:opacity-60"
            >
              <LogOut size={20} />
              <span>{loggingOut ? (isVietnamese ? 'Đang đăng xuất...' : 'Signing out...') : isVietnamese ? 'Đăng xuất' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
