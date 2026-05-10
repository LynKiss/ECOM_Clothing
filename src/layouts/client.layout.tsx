import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  ChevronDown,
  Menu,
  X,
  Shirt,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Youtube,
  Heart,
  Bell,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useClientSession } from '../hooks/useClientSession';
import { useCart } from '../hooks/useCart';
import { logoutClient, clientApi } from '../lib/client-api';
import { getSocialLinks } from '../pages/Settings';
import { lazy, Suspense } from 'react';

const Chatbox = lazy(() => import('../components/client/Chatbox'));
const VoucherWalletModal = lazy(() => import('../components/client/VoucherWalletModal'));

type SearchProduct = {
  productId: string;
  productName: string;
  productPrice: string;
  effectivePrice: string;
  primaryImageUrl: string | null;
};

type Notification = {
  id: string | null;
  title: string;
  message: string;
  metadata: { orderId?: string; type?: string } | null;
  createdAt: string | null;
  channel: string;
};

type CategoryTreeNode = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  children?: CategoryTreeNode[];
};

const FALLBACK_CATEGORY_TREE: CategoryTreeNode[] = [
  { categoryId: 'new', categoryName: 'MỚI', categorySlug: 'new', children: [{ categoryId: 'new-1', categoryName: 'Sản phẩm mới', categorySlug: 'san-pham-moi' }, { categoryId: 'new-2', categoryName: 'Bán chạy nhất', categorySlug: 'ban-chay' }] },
  { categoryId: 'nam', categoryName: 'NAM', categorySlug: 'nam', children: [{ categoryId: 'nam-ao', categoryName: 'Áo nam', categorySlug: 'ao-nam' }, { categoryId: 'nam-quan', categoryName: 'Quần nam', categorySlug: 'quan-nam' }, { categoryId: 'nam-sport', categoryName: 'Đồ thể thao', categorySlug: 'do-the-thao' }] },
  { categoryId: 'nu', categoryName: 'NỮ', categorySlug: 'nu', children: [{ categoryId: 'nu-ao', categoryName: 'Áo nữ', categorySlug: 'ao-nu' }, { categoryId: 'nu-vay', categoryName: 'Đầm và chân váy', categorySlug: 'dam-vay' }, { categoryId: 'nu-sport', categoryName: 'Đồ thể thao nữ', categorySlug: 'do-the-thao-nu' }] },
  { categoryId: 'the-thao', categoryName: 'THỂ THAO', categorySlug: 'the-thao', children: [{ categoryId: 'running', categoryName: 'Running', categorySlug: 'running' }, { categoryId: 'training', categoryName: 'Training', categorySlug: 'training' }, { categoryId: 'pickleball', categoryName: 'Pickleball', categorySlug: 'pickleball' }] },
  { categoryId: 'phu-kien', categoryName: 'PHỤ KIỆN', categorySlug: 'phu-kien', children: [{ categoryId: 'tat', categoryName: 'Tất', categorySlug: 'tat' }, { categoryId: 'mu', categoryName: 'Mũ', categorySlug: 'mu' }, { categoryId: 'tui', categoryName: 'Túi', categorySlug: 'tui' }] },
];

function categoryHref(category: CategoryTreeNode) {
  return '/client/products?categoryIds=' + encodeURIComponent(category.categoryId);
}

function normalizeCategoryKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function categoryMatches(category: CategoryTreeNode, keywords: string[]) {
  const key = normalizeCategoryKey(`${category.categoryName} ${category.categorySlug}`);
  return keywords.some((keyword) => key.includes(keyword));
}

function buildNavCategories(tree: CategoryTreeNode[]) {
  const categories = tree.length ? tree : FALLBACK_CATEGORY_TREE;
  const findByKeywords = (keywords: string[]) =>
    categories.find((category) => categoryMatches(category, keywords));

  const ordered = [
    FALLBACK_CATEGORY_TREE[0],
    findByKeywords(['nam']),
    findByKeywords(['nu']),
    findByKeywords(['the thao', 'sport']),
    findByKeywords(['phu kien', 'accessory']),
  ].filter(Boolean) as CategoryTreeNode[];

  const seen = new Set<string>();
  const result = ordered.filter((category) => {
    if (seen.has(category.categoryId)) {
      return false;
    }
    seen.add(category.categoryId);
    return true;
  });

  for (const category of categories) {
    if (result.length >= 5) {
      break;
    }
    if (!seen.has(category.categoryId)) {
      seen.add(category.categoryId);
      result.push(category);
    }
  }

  return result;
}

function getMegaColumns(category: CategoryTreeNode) {
  const children = category.children ?? [];
  if (children.length === 0) {
    return [category];
  }

  return children.slice(0, 4);
}

function getColumnItems(category: CategoryTreeNode) {
  return (category.children ?? []).slice(0, 9);
}

export default function ClientLayout() {
  const { session } = useClientSession();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(FALLBACK_CATEGORY_TREE);
  const [activeMega, setActiveMega] = useState<CategoryTreeNode | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Apply client theme from Interface settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('client_theme_config');
      if (!raw) return;
      const cfg = JSON.parse(raw) as { themeId?: string; primaryColor?: string; fontId?: string };
      const THEMES: Record<string, { primary: string; accent: string; bg: string }> = {
        botanical: { primary: '#1b5e20', accent: '#d9f7c9', bg: '#f4f7f1' },
        harvest: { primary: '#92400e', accent: '#fde68a', bg: '#fffbeb' },
        midnight: { primary: '#8bdc8b', accent: '#1d3a29', bg: '#0f1713' },
      };
      const theme = cfg.themeId ? THEMES[cfg.themeId] : null;
      if (theme) {
        document.documentElement.style.setProperty('--client-primary', theme.primary);
        document.documentElement.style.setProperty('--client-accent', theme.accent);
        document.documentElement.style.setProperty('--client-bg', theme.bg);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    void clientApi
      .get<Notification[]>('/notifications/me')
      .then((data) => setNotifications(data.filter((n) => n.channel === 'SYSTEM')))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    void clientApi
      .get<CategoryTreeNode[]>('/categories/tree')
      .then((items) => setCategoryTree(items.length ? items : FALLBACK_CATEGORY_TREE))
      .catch(() => setCategoryTree(FALLBACK_CATEGORY_TREE));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Search autocomplete debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(() => {
      void clientApi
        .get<{ meta: unknown; items: SearchProduct[] }>(`/products?search=${encodeURIComponent(searchQuery)}&limit=6`)
        .then((data) => {
          setSuggestions(data.items ?? []);
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      setShowSuggestions(false);
      void navigate(`/client/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (productId: string) => {
    setSearchOpen(false);
    setShowSuggestions(false);
    setSearchQuery('');
    void navigate(`/client/products/${productId}`);
  };

  const handleLogout = async () => {
    await logoutClient();
    setUserMenuOpen(false);
    void navigate('/client');
  };

  const cartCount = cart?.totalItems ?? 0;
  const displayName = session?.user.fullName || session?.user.username || '';
  const socialLinks = getSocialLinks();
  const aiDiagnosisLink = {
    to: '/client/style-advisor',
    label: 'AI Tư Vấn Phối Đồ',
  };
  const navLinks = [
    { to: '/client/news', label: 'Blog', end: false },
  ];
  const navCategories = buildNavCategories(categoryTree);
  const megaColumns = activeMega ? getMegaColumns(activeMega) : [];
  const supportLinks = [
    { to: '/client/support/buying-guide', label: 'Hướng dẫn mua hàng' },
    { to: '/client/support/returns', label: 'Chính sách đổi trả' },
    { to: '/client/support/warranty', label: 'Chính sách bảo hành' },
    { to: '/client/support/news-knowledge', label: 'Tin tức & kiến thức' },
    { to: '/client/support/contact', label: 'Liên hệ chúng tôi' },
  ];

  return (
    <div className="client-surface flex min-h-screen flex-col">
      {/* Top bar */}
      <div style={{ background: '#707070' }} className="hidden text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone size={11} />
              1800 6863
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={11} />
              support@coolmate.vn
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <MapPin size={11} />
            Giao hàng toàn quốc - miễn phí đơn từ 500.000đ
          </span>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={`sticky top-0 z-50 border-b border-black/10 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)]' : ''
        }`}
        style={{ background: '#fff' }}
        onMouseLeave={() => setActiveMega(null)}
      >
        <div className="mx-auto flex max-w-[1760px] items-center gap-5 px-4 py-3 lg:px-10 lg:py-4">
          {/* Logo */}
          <Link to="/client" className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: '#2563EB' }}
            >
              <Shirt size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#2563EB' }}>
                Coolmate
              </p>
              <p className="text-xs font-black leading-none" style={{ color: '#0B0F19' }}>
                Thời Trang Coolmate
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {navCategories.map((category, index) => (
              <Link
                key={category.categoryId}
                to={categoryHref(category)}
                onMouseEnter={() => setActiveMega(category)}
                className={
                  'border-b-[3px] whitespace-nowrap px-1 py-5 text-[15px] font-black uppercase transition ' +
                  (index === 0 ? 'text-[#2538d5]' : 'text-black hover:text-[#2538d5]') +
                  ' ' +
                  (activeMega?.categoryId === category.categoryId ? 'border-black' : 'border-transparent')
                }
              >
                {category.categoryName}
              </Link>
            ))}
            <Link to="/client/products?onSale=1" className="flex flex-col items-center justify-center whitespace-nowrap text-base font-black uppercase leading-none text-red-600">
              <span className="text-xs">-50%</span>
              <span>Sale</span>
            </Link>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  'hidden px-2 py-2 text-sm font-bold transition xl:inline-flex ' +
                  (isActive ? 'text-[#2538d5]' : 'text-black hover:text-[#2538d5]')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {activeMega && (
            <div className="absolute left-0 top-full hidden w-full border-t border-black/10 bg-white shadow-xl lg:block">
              <div className="mx-auto max-w-[1580px] px-10 py-8">
                <div className="grid grid-cols-5 gap-8">
                  <div>
                    <Link to="/client/products" className="mb-5 flex items-center justify-between text-base font-black uppercase text-black">
                      Tất cả sản phẩm <span className="text-[#2538d5]">→</span>
                    </Link>
                    <div className="space-y-4 text-sm font-bold">
                      <Link to="/client/products?sortBy=created_at&sortOrder=DESC" className="block text-[#2538d5]">Sản phẩm mới</Link>
                      <Link to="/client/products?sort=popular" className="block text-black">Bán chạy nhất</Link>
                      <Link to="/client/products" className="block text-gray-500">Khám phá bộ sưu tập</Link>
                      <Link to="/client/products?onSale=1" className="block text-gray-500">Ưu đãi</Link>
                    </div>
                  </div>
                  {megaColumns.map((category) => {
                    const columnItems = getColumnItems(category);
                    return (
                    <div key={category.categoryId}>
                      <Link to={categoryHref(category)} className="mb-5 flex items-center justify-between text-base font-black uppercase text-black">
                        {category.categoryName} <span className="text-[#2538d5]">→</span>
                      </Link>
                      <div className="space-y-4 text-sm font-semibold text-gray-600">
                        <Link to={categoryHref(category)} className="block">Tất cả</Link>
                        {columnItems.map((child) => (
                          <Link key={child.categoryId} to={categoryHref(child)} className="block hover:text-black">{child.categoryName}</Link>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div className="mt-8 grid grid-cols-5 border-t border-black/10 bg-gray-50 text-sm font-black uppercase text-black">
                  {['Theo nhu cầu', 'Đồ lót', 'Đồ thể thao', 'Mặc hằng ngày', 'Đồ bơi'].map((label, index) => (
                    <Link
                      key={label}
                      to={index === 0 ? categoryHref(activeMega) : `/client/products?search=${encodeURIComponent(label)}`}
                      className="border-r border-black/5 px-8 py-5 last:border-r-0 hover:text-[#2538d5]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            {/* Search with autocomplete */}
            <div ref={searchContainerRef} className="relative hidden lg:block">
              <form
                onSubmit={handleSearch}
                className="flex h-12 w-[320px] items-center rounded-full border border-black/20 bg-white px-5 transition focus-within:border-black"
              >
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Tìm kiếm..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                    className="mr-2 text-gray-400 hover:text-black"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={15} />
                  </button>
                ) : null}
                <button type="submit" className="text-gray-600 hover:text-black" aria-label="Tìm kiếm">
                  <Search size={22} />
                </button>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-[380px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
                  {suggestions.map((p) => (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => handleSuggestionClick(p.productId)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {p.primaryImageUrl ? (
                          <img src={p.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Shirt size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-black">{p.productName}</p>
                        <p className="text-sm font-black text-[#2538d5]">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p.effectivePrice))}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      void navigate(`/client/products?search=${encodeURIComponent(searchQuery)}`);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-black/5 py-3 text-xs font-black text-[#2538d5] hover:bg-gray-50"
                  >
                    <Search size={12} /> Xem tất cả kết quả
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 lg:hidden"
              style={{ color: '#0B0F19' }}
              aria-label="Mo tim kiem"
            >
              <Search size={20} />
            </button>

            {/* Notification bell */}
            {session && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#2563EB]/10"
                  style={{ color: '#0B0F19' }}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="client-menu-surface absolute right-0 top-full mt-2 w-80 overflow-hidden">
                    <div className="border-b border-black/5 px-4 py-3">
                      <p className="text-sm font-bold text-[#0B0F19]">Thông báo</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Bell size={28} className="mb-2 text-gray-200" />
                          <p className="text-xs text-gray-400">Chưa có thông báo</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n, idx) => {
                          const orderId = n.metadata?.orderId;
                          const inner = (
                            <>
                              <p className="text-xs font-semibold text-[#0B0F19]">{n.title}</p>
                              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                              {n.createdAt && (
                                <p className="mt-1 text-[10px] text-gray-400">
                                  {new Date(n.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </>
                          );
                          return orderId ? (
                            <Link
                              key={n.id ?? idx}
                              to={`/client/orders/${orderId}`}
                              onClick={() => setNotifOpen(false)}
                              className="block border-b border-black/5 px-4 py-3 last:border-0 hover:bg-gray-50 transition"
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              key={n.id ?? idx}
                              className="border-b border-black/5 px-4 py-3 last:border-0"
                            >
                              {inner}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {session && (
              <Link
                to="/client/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#2563EB]/10"
                style={{ color: '#0B0F19' }}
              >
                <Heart size={18} />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/client/cart"
              data-cart-icon="true"
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#2563EB]/10"
              style={{ color: '#0B0F19' }}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c82014] px-1 text-[9px] font-black text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {session ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition hover:bg-[#2563EB]/10"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                    style={{ background: '#2563EB' }}
                  >
                    {session.user.avatarUrl ? (
                      <img src={session.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (displayName[0] ?? 'U').toUpperCase()
                    )}
                  </div>
                  <span className="hidden text-sm font-semibold text-[#0B0F19] lg:block">
                    {displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#0B0F19] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="client-menu-surface absolute right-0 top-full mt-2 w-52 overflow-hidden">
                    <div className="border-b border-black/5 px-4 py-3">
                      <p className="text-sm font-bold text-[#0B0F19]">{displayName}</p>
                      <p className="truncate text-xs text-gray-400">{session.user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/client/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#0B0F19] transition hover:bg-[#2563EB]/8"
                      >
                        <User size={15} /> Tài khoản của tôi
                      </Link>
                      <Link
                        to="/client/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#0B0F19] transition hover:bg-[#2563EB]/8"
                      >
                        <Package size={15} /> Đơn hàng
                      </Link>
                      <Link
                        to="/client/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#0B0F19] transition hover:bg-[#2563EB]/8"
                      >
                        <Heart size={15} /> Yêu thích
                      </Link>
                      <button
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/client/login"
                className="client-pill-primary hidden px-5 py-2 text-sm font-bold lg:flex"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#2563EB]/10 lg:hidden"
              style={{ color: '#0B0F19' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t border-black/10 bg-white px-4 pb-5 pt-3 lg:hidden">
            <form onSubmit={handleSearch} className="mb-3 flex h-12 items-center rounded-full border border-black/15 px-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button type="submit" className="text-black"><Search size={19} /></button>
            </form>
            <nav className="flex flex-col gap-1">
              {navCategories.map((category) => (
                <Link
                  key={category.categoryId}
                  to={categoryHref(category)}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-black uppercase text-black hover:bg-gray-50"
                >
                  {category.categoryName}
                </Link>
              ))}
              <Link
                to="/client/products?onSale=1"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-black uppercase text-red-600 hover:bg-red-50"
              >
                Sale
              </Link>
              <Link
                to="/client/style-advisor"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-[#2538d5]/20 bg-[#eef2ff] px-4 py-3 text-sm font-black text-[#2538d5]"
              >
                AI Tư vấn phối đồ
              </Link>
              {!session ? (
                <div className="mt-3 flex gap-2 border-t border-black/5 pt-3">
                  <Link to="/client/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-full bg-black py-3 text-center text-sm font-black text-white">Đăng nhập</Link>
                  <Link to="/client/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-full border border-black py-3 text-center text-sm font-black text-black">Đăng ký</Link>
                </div>
              ) : null}
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: '#0B0F19' }} className="text-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: '#1D4ED8' }}>
                  <Shirt size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Coolmate</p>
                  <p className="text-sm font-black text-white">Thời Trang Coolmate</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Cửa hàng thời trang Coolmate với sản phẩm basic dễ mặc, size rõ ràng, đổi trả linh hoạt và giao hàng nhanh toàn quốc.
              </p>
              <div className="mt-5 flex gap-3">
                {(socialLinks.facebook || '#') && (
                  <a href={socialLinks.facebook || '#'} target={socialLinks.facebook ? '_blank' : undefined} rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white">
                    <Facebook size={16} />
                  </a>
                )}
                {(socialLinks.youtube || '#') && (
                  <a href={socialLinks.youtube || '#'} target={socialLinks.youtube ? '_blank' : undefined} rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white">
                    <Youtube size={16} />
                  </a>
                )}
                {socialLinks.zalo && (
                  <a href={socialLinks.zalo} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-black text-white/60 transition hover:border-white/30 hover:text-white">
                    Zalo
                  </a>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white/40">Sản phẩm</h3>
              <ul className="space-y-3 text-sm text-white/60">
                {['Áo', 'Quần', 'Đầm & chân váy', 'Áo khoác', 'Phụ kiện'].map((item) => (
                  <li key={item}>
                    <Link to="/client/products" className="transition hover:text-white">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white/40">Hỗ trợ</h3>
              <ul className="space-y-3 text-sm text-white/60">
                {supportLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition hover:text-white">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-white/40">Liên hệ</h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-2.5"><Phone size={14} className="mt-0.5 shrink-0" /><span>1800 6863 miễn phí</span></li>
                <li className="flex items-start gap-2.5"><Mail size={14} className="mt-0.5 shrink-0" /><span>support@coolmate.vn</span></li>
                <li className="flex items-start gap-2.5"><MapPin size={14} className="mt-0.5 shrink-0" /><span>123 Coolmate Store, Quận 1, TP.HCM</span></li>
              </ul>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[11px] text-white/40">Mở cửa</p>
                <p className="text-sm font-bold text-white">7:00 - 21:00 mỗi ngày</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 text-xs text-white/30 sm:flex-row">
            <p>© 2026 Coolmate. Bảo lưu mọi quyền.</p>
            <div className="flex gap-6">
              <a href="#" className="transition hover:text-white/60">Chính sách bảo mật</a>
              <a href="#" className="transition hover:text-white/60">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Chatbox */}
      <Link
        to="/client/virtual-try-on"
        className="group fixed bottom-[10.5rem] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0.14)] transition-all hover:scale-105 active:scale-95"
        aria-label="Thu do bang anh"
        title="Thử đồ bằng ảnh"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-35" />
        <Camera size={23} className="relative" />
        <Sparkles size={13} className="absolute right-3 top-3 text-white" />
      </Link>
      <Suspense fallback={null}>
        <VoucherWalletModal />
        <Chatbox />
      </Suspense>
    </div>
  );
}










