import { useState } from 'react';
import { Search, Bell, Globe, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession';
import { useToast } from '../hooks/useToast';
import { logoutAdmin } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

export default function Topbar() {
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
    <header className="fixed top-0 right-0 left-64 z-40 flex h-20 items-center justify-between border-b border-on-surface-variant/5 bg-surface/80 px-10 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-8">
        <h2 className="text-xl font-black tracking-tight text-primary">
          {isVietnamese ? 'Trung tâm điều hành' : 'Operations Center'}
        </h2>

        <div className="relative hidden w-full max-w-md lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
          <input
            type="text"
            placeholder={isVietnamese ? 'Tìm nhanh tài nguyên...' : 'Quick search across resources...'}
            className="w-full rounded-full border-none bg-on-surface-variant/5 py-2.5 pl-12 pr-6 text-sm transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="mr-4 hidden items-center gap-6 md:flex">
          <a href="#" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
            {isVietnamese ? 'Phân tích' : 'Analytics'}
          </a>
          <a href="#" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
            {isVietnamese ? 'Vận hành' : 'Operations'}
          </a>
        </nav>

        <div className="flex items-center gap-4 border-l border-on-surface-variant/10 pl-6 text-on-surface-variant/80">
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
          <button className="p-1 transition-colors hover:text-primary">
            <User size={20} />
          </button>
        </div>

        <button
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl disabled:opacity-60"
        >
          <LogOut size={16} />
          {loggingOut
            ? isVietnamese
              ? 'Đang đăng xuất...'
              : 'Signing out...'
            : session?.user.username || (isVietnamese ? 'Đăng xuất' : 'Sign out')}
        </button>
      </div>
    </header>
  );
}
