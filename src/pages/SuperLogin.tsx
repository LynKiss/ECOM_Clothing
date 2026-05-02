import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Shirt,
} from 'lucide-react';
import { useSuperAdminSession } from '../hooks/useSuperAdminSession';
import { loginSuperAdmin } from '../lib/super-admin-api';

export default function SuperLoginPage() {
  const { session } = useSuperAdminSession();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as { from?: string } | null)?.from;
  const redirectTo = rawFrom?.startsWith('/super') ? rawFrom : '/super/permissions';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginSuperAdmin(normalizedUsername, password);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Không thể đăng nhập Super Admin.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#0B0F19]">
      <div className="mx-auto grid min-h-screen max-w-[1280px] items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden min-h-[720px] overflow-hidden rounded-xl bg-[#08111F] text-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.75)] lg:block">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85"
            alt="Coolmate security control"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.94),rgba(8,17,31,0.74),rgba(8,17,31,0.42))]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]">
                <Shirt size={24} />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.32em] text-[#BFDBFE]">
                  Coolmate
                </span>
                <span className="block text-lg font-black">Super Admin</span>
              </span>
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#93C5FD]">
                Khu vực tối cao
              </p>
              <h1 className="mt-5 text-6xl font-black leading-[1.02]">
                Quản trị quyền truy cập toàn hệ thống.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/72">
                Tài khoản này tách khỏi MySQL admin thường, dùng MongoDB riêng
                để cấp quyền vận hành cho từng admin/staff.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {['MongoDB riêng', 'JWT riêng', 'Audit đầy đủ'].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/12 bg-white/10 p-4 text-sm font-black backdrop-blur"
                >
                  <ShieldCheck size={19} className="mb-4 text-[#93C5FD]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[520px]">
          <div className="mb-7 inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white">
              <Shirt size={24} />
            </span>
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.32em] text-[#2563EB]">
                Coolmate
              </span>
              <span className="block text-base font-black">Super Admin</span>
            </span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] sm:p-9">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-black text-[#1D4ED8]">
              <ShieldCheck size={14} />
              Xác thực riêng
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight">
              Đăng nhập Super Admin
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Chỉ dùng cho tài khoản tối cao đã seed từ biến môi trường và lưu
              trong MongoDB.
            </p>

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Email hoặc username
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                    placeholder="superadmin@coolmate.vn"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Mật khẩu</label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#2563EB]"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-black text-white shadow-[0_18px_35px_-20px_rgba(37,99,235,0.85)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : null}
                {loading ? 'Đang đăng nhập...' : 'Vào phân quyền'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
