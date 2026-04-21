import {
  BarChart3,
  ChevronDown,
  FolderTree,
  Globe,
  Hash,
  KeyRound,
  LayoutDashboard,
  Layers,
  MonitorSmartphone,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAdminSession } from '../hooks/useAdminSession';
import { useLanguage } from '../i18n/language-context';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  id: string;
  label: string;
  path?: string;
  icon: typeof LayoutDashboard;
  children?: Array<{
    id: string;
    label: string;
    path: string;
  }>;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { session } = useAdminSession();
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: isVietnamese ? 'Tổng quan' : 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
    },
    {
      id: 'products',
      label: isVietnamese ? 'Sản phẩm' : 'Products',
      icon: Package,
      children: [
        {
          id: 'products-all',
          label: isVietnamese ? 'Tất cả sản phẩm' : 'All products',
          path: '/admin/products',
        },
        {
          id: 'products-new',
          label: isVietnamese ? 'Thêm sản phẩm' : 'Add product',
          path: '/admin/products/new',
        },
        {
          id: 'products-import',
          label: isVietnamese ? 'Nhập kho' : 'Import inventory',
          path: '/admin/products/import',
        },
        {
          id: 'products-stock',
          label: isVietnamese ? 'Giao dịch kho' : 'Inventory transactions',
          path: '/admin/products/inventory-transactions',
        },
        {
          id: 'products-damage',
          label: isVietnamese ? 'Hàng hỏng / trả hàng' : 'Damage & returns',
          path: '/admin/products/inventory-damage',
        },
        {
          id: 'products-lowstock',
          label: isVietnamese ? 'Tổng quan tồn kho' : 'Inventory overview',
          path: '/admin/products/inventory-lowstock',
        },
        {
          id: 'products-discounts',
          label: isVietnamese ? 'Chương trình giảm giá' : 'Discount programs',
          path: '/admin/products/discounts',
        },
      ],
    },
    {
      id: 'categories',
      label: isVietnamese ? 'Danh mục' : 'Categories',
      icon: FolderTree,
      path: '/admin/categories',
    },
    {
      id: 'subcategories',
      label: isVietnamese ? 'Danh mục phụ' : 'Subcategories',
      icon: Layers,
      path: '/admin/subcategories',
    },
    {
      id: 'origins',
      label: isVietnamese ? 'Xuất xứ' : 'Origins',
      icon: Globe,
      path: '/admin/origins',
    },
    {
      id: 'tags',
      label: isVietnamese ? 'Nhãn sản phẩm' : 'Tags',
      icon: Hash,
      path: '/admin/tags',
    },
    {
      id: 'orders',
      label: isVietnamese ? 'Đơn hàng' : 'Orders',
      icon: ShoppingCart,
      path: '/admin/orders',
    },
    {
      id: 'customers',
      label: isVietnamese ? 'Tài khoản' : 'Customers',
      icon: Users,
      path: '/admin/customers',
    },
    {
      id: 'news',
      label: isVietnamese ? 'Bài viết' : 'Articles',
      icon: Newspaper,
      path: '/admin/news',
    },
    {
      id: 'reports',
      label: isVietnamese ? 'Báo cáo' : 'Reports',
      icon: BarChart3,
      path: '/admin/reports',
    },
    {
      id: 'permissions',
      label: isVietnamese ? 'Phân quyền' : 'Permissions',
      icon: KeyRound,
      path: '/admin/permissions',
    },
    {
      id: 'interface',
      label: isVietnamese ? 'Giao diện' : 'Interface',
      icon: MonitorSmartphone,
      path: '/admin/interface',
    },
    {
      id: 'security',
      label: isVietnamese ? 'Bảo mật' : 'Security',
      icon: ShieldCheck,
      path: '/admin/security',
    },
    {
      id: 'settings',
      label: isVietnamese ? 'Cấu hình' : 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    products: location.pathname.startsWith('/admin/products'),
  });

  useEffect(() => {
    if (location.pathname.startsWith('/admin/products')) {
      setOpenGroups((current) => ({ ...current, products: true }));
    }
  }, [location.pathname]);

  const displayName =
    session?.user.username || (isVietnamese ? 'Quản trị viên' : 'Administrator');
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
        <div className="mb-4 flex items-start justify-between gap-4 px-3 lg:mb-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">
              Cultivated Ledger
            </h1>
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

        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto pr-1">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              if (item.children) {
                const isGroupActive = item.children.some(
                  (child) => location.pathname === child.path,
                );
                const isOpen = openGroups[item.id] ?? false;

                return (
                  <div key={item.id} className="rounded-[1.5rem]">
                    <div
                      className={`flex items-center rounded-full text-sm font-medium transition-all duration-200 ${
                        isGroupActive || isOpen
                          ? 'bg-white/8 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <NavLink
                        to={item.children[0]?.path ?? '/admin/products'}
                        onClick={onClose}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroups((current) => ({
                            ...current,
                            [item.id]: !current[item.id],
                          }))
                        }
                        className="mr-2 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="mt-1 space-y-0.5 pl-4">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.id}
                            to={child.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs transition ${
                                isActive
                                  ? 'bg-accent font-bold text-primary shadow-sm shadow-accent/20'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`
                            }
                          >
                            <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
                            <span>{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path ?? '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-accent font-bold text-primary shadow-lg shadow-accent/20'
                        : 'text-white/60 hover:bg-white/5 hover:text-white active:scale-95'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/20 font-bold text-accent">
              {initials || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-xs text-white/40">
                {session?.user.email || (isVietnamese ? 'phiên quản trị' : 'admin session')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
