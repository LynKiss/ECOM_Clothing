import { FormEvent, useMemo, useState } from 'react';
import { LockKeyhole, LogOut, ServerCrash } from 'lucide-react';
import { getApiBaseUrl, loginAdmin, logoutAdmin } from '../../lib/api';
import { useAdminSession } from '../../hooks/useAdminSession';
import { useLanguage } from '../../i18n/language-context';

type AdminAccessPanelProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export default function AdminAccessPanel({
  title,
  description,
  compact = false,
}: AdminAccessPanelProps) {
  const { session } = useAdminSession();
  const { language } = useLanguage();
  const [username, setUsername] = useState('admin@gmail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVietnamese = language === 'vi';

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginAdmin(username, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : isVietnamese ? 'Đăng nhập thất bại' : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      await logoutAdmin();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : isVietnamese ? 'Đăng xuất thất bại' : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return (
      <div className={`rounded-[2rem] border border-primary/10 bg-white shadow-sm ${compact ? 'p-5' : 'p-7'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/50">Admin API</p>
            <h3 className="mt-2 text-lg font-black text-primary">
              {isVietnamese ? 'Đã kết nối backend' : 'Backend connected'}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              {isVietnamese ? 'Đang đăng nhập với ' : 'Signed in as '}
              <span className="font-semibold text-on-surface">{session.user.email}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-on-surface/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition hover:border-primary/20 hover:text-primary disabled:opacity-50"
          >
            <LogOut size={14} />
            {isVietnamese ? 'Đăng xuất' : 'Logout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[2rem] border border-primary/10 bg-white shadow-sm ${compact ? 'p-5' : 'p-7'}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/50">
            {isVietnamese ? 'API bảo vệ' : 'Protected API'}
          </p>
          <h3 className="text-lg font-black text-primary">{title}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-on-surface-variant">{description}</p>
      <p className="mt-2 text-xs text-on-surface-variant/70">API base: {apiBaseUrl}</p>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={isVietnamese ? 'Tên đăng nhập hoặc email' : 'Username or email'}
          className="w-full rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary/30"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isVietnamese ? 'Mật khẩu' : 'Password'}
          className="w-full rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-container disabled:opacity-60"
        >
          {loading
            ? isVietnamese
              ? 'Đang kết nối...'
              : 'Connecting...'
            : isVietnamese
              ? 'Đăng nhập để tải dữ liệu quản trị'
              : 'Sign in to load admin data'}
        </button>
      </form>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ServerCrash size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}


