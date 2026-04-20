import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  MoonStar,
  Search,
  Settings,
  ShieldCheck,
  SunMedium,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession';
import { useToast } from '../hooks/useToast';
import { logoutAdmin } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useTheme } from '../theme/theme-context';

type TopbarProps = {
  onOpenSidebar: () => void;
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { session } = useAdminSession();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const { themeMode, resolvedTheme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isVietnamese = language === 'vi';

  const initials = useMemo(
    () =>
      (session?.user.username || 'Admin')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(''),
    [session?.user.username],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logoutAdmin();
      showToast({
        tone: 'info',
        title: isVietnamese ? 'Đã đăng xuất' : 'Signed out',
        description: isVietnamese
          ? 'Bạn đã quay về trang đăng nhập.'
          : 'You have been returned to the sign-in screen.',
      });
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setAccountMenuOpen(false);
    }
  }

  return (
    <header className="app-elevated-soft sticky top-0 z-30 flex h-20 items-center justify-between border-b border-on-surface-variant/5 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-on-surface-variant/10 bg-white text-on-surface shadow-sm transition hover:border-primary/20 hover:text-primary lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-black tracking-tight text-primary sm:text-xl">
            {isVietnamese ? 'Trung tâm điều hành' : 'Operations Center'}
          </h2>
        </div>

        <div className="relative hidden w-full max-w-md lg:block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
            size={18}
          />
          <input
            type="text"
            placeholder={
              isVietnamese
                ? 'Tìm nhanh tài nguyên...'
                : 'Quick search across resources...'
            }
            className="w-full rounded-full border-none bg-on-surface-variant/5 py-2.5 pl-12 pr-6 text-sm transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
        <nav className="mr-2 hidden items-center gap-6 md:flex">
          <a
            href="#"
            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            {isVietnamese ? 'Phân tích' : 'Analytics'}
          </a>
          <a
            href="#"
            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            {isVietnamese ? 'Vận hành' : 'Operations'}
          </a>
        </nav>

        <div className="flex items-center gap-3 border-l border-on-surface-variant/10 pl-3 text-on-surface-variant/80 sm:gap-4 sm:pl-4 lg:pl-6">
          <button
            type="button"
            className="relative p-1 transition-colors hover:text-primary"
          >
            <Bell size={20} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-surface bg-red-500" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-on-surface-variant/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors hover:border-primary/20 hover:text-primary"
            title={
              resolvedTheme === 'dark'
                ? isVietnamese
                  ? 'Chuyển sang giao diện sáng'
                  : 'Switch to light mode'
                : isVietnamese
                  ? 'Chuyển sang giao diện tối'
                  : 'Switch to dark mode'
            }
          >
            {resolvedTheme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            <span className="hidden lg:inline">
              {themeMode === 'system'
                ? isVietnamese
                  ? 'Hệ thống'
                  : 'System'
                : resolvedTheme === 'dark'
                  ? isVietnamese
                    ? 'Sáng'
                    : 'Light'
                  : isVietnamese
                    ? 'Tối'
                    : 'Dark'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="inline-flex items-center gap-2 p-1 transition-colors hover:text-primary"
            title={isVietnamese ? 'Chuyển ngôn ngữ' : 'Switch language'}
          >
            <Globe size={20} />
            <span className="hidden text-xs font-black uppercase tracking-widest lg:inline">
              {language === 'vi' ? 'VI' : 'EN'}
            </span>
          </button>

          <div ref={accountMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-on-surface-variant/10 bg-white px-2 py-1.5 text-on-surface transition hover:border-primary/20 hover:text-primary"
              title={isVietnamese ? 'Mở menu tài khoản' : 'Open account menu'}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed to-primary text-xs font-black text-primary">
                {initials || 'AD'}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {accountMenuOpen ? (
              <div className="app-elevated absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-[1.75rem] border border-on-surface-variant/10 p-3">
                <div className="rounded-[1.25rem] bg-on-surface-variant/5 px-4 py-4">
                  <p className="text-sm font-black text-on-surface">
                    {session?.user.username || (isVietnamese ? 'Quản trị viên' : 'Administrator')}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {session?.user.email || 'admin@local'}
                  </p>
                </div>

                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/admin/security');
                    }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-on-surface-variant/5 hover:text-primary"
                  >
                    <ShieldCheck size={18} />
                    <span>{isVietnamese ? 'Bảo mật tài khoản' : 'Account security'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/admin/settings');
                    }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-on-surface-variant/5 hover:text-primary"
                  >
                    <Settings size={18} />
                    <span>{isVietnamese ? 'Cài đặt giao diện' : 'Appearance settings'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-on-surface-variant/5 hover:text-primary"
                  >
                    {resolvedTheme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
                    <span>
                      {resolvedTheme === 'dark'
                        ? isVietnamese
                          ? 'Đổi sang giao diện sáng'
                          : 'Switch to light mode'
                        : isVietnamese
                          ? 'Đổi sang giao diện tối'
                          : 'Switch to dark mode'}
                    </span>
                  </button>
                </div>

                <div className="mt-3 border-t border-on-surface-variant/8 pt-3">
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <LogOut size={18} />
                    <span>
                      {loggingOut
                        ? isVietnamese
                          ? 'Đang đăng xuất...'
                          : 'Signing out...'
                        : isVietnamese
                          ? 'Đăng xuất'
                          : 'Sign out'}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl disabled:opacity-60 sm:px-5"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">
            {loggingOut
              ? isVietnamese
                ? 'Đang đăng xuất...'
                : 'Signing out...'
              : session?.user.username || (isVietnamese ? 'Đăng xuất' : 'Sign out')}
          </span>
        </button>
      </div>
    </header>
  );
}
