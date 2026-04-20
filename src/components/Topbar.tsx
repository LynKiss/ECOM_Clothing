import { useState } from 'react';
import { Search, Bell, Globe, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession';
import { useToast } from '../hooks/useToast';
import { logoutAdmin } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

type TopbarProps = {
  onOpenSidebar: () => void;
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { session } = useAdminSession();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const isVietnamese = language === 'vi';

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
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-on-surface-variant/5 bg-surface/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input
            type="text"
            placeholder={isVietnamese ? 'Tìm nhanh tài nguyên...' : 'Quick search across resources...'}
            className="w-full rounded-full border-none bg-on-surface-variant/5 py-2.5 pl-12 pr-6 text-sm transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
        <nav className="mr-2 hidden items-center gap-6 md:flex">
          <a href="#" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
            {isVietnamese ? 'Phân tích' : 'Analytics'}
          </a>
          <a href="#" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
            {isVietnamese ? 'Vận hành' : 'Operations'}
          </a>
        </nav>

        <div className="flex items-center gap-3 border-l border-on-surface-variant/10 pl-3 text-on-surface-variant/80 sm:gap-4 sm:pl-4 lg:pl-6">
          <button className="relative p-1 transition-colors hover:text-primary">
            <Bell size={20} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-surface bg-red-500" />
          </button>
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="inline-flex items-center gap-2 p-1 transition-colors hover:text-primary"
            title={isVietnamese ? 'Chuyển ngôn ngữ' : 'Switch language'}
          >
            <Globe size={20} />
            <span className="hidden text-xs font-black uppercase tracking-widest lg:inline">
              {language === 'vi' ? 'VI' : 'EN'}
            </span>
          </button>
          <button className="hidden p-1 transition-colors hover:text-primary sm:block">
            <User size={20} />
          </button>
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
