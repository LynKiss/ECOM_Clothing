import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Shield, Shirt } from 'lucide-react';
import { useCentralSuperSession } from '../hooks/useCentralSuperSession';
import { loginCentralSuper } from '../lib/central-super-api';

export default function CentralSuperLoginPage() {
  const { session } = useCentralSuperSession();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as { from?: string } | null)?.from;
  const redirectTo = rawFrom?.startsWith('/central-super') ? rawFrom : '/central-super/config';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginCentralSuper(normalizedEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#0B0F19]">
      <div className="mx-auto grid min-h-screen max-w-[1280px] items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left panel */}
        <section className="relative hidden min-h-[720px] overflow-hidden rounded-2xl bg-[#08111F] text-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.75)] lg:block">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.95),rgba(8,17,31,0.75),rgba(8,17,31,0.4))]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]">
                <Shirt size={24} />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.32em] text-[#BFDBFE]">Coolmate</span>
                <span className="block text-lg font-black">Central Super Admin</span>
              </span>
            </div>
            <div className="max-w-xl">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#93C5FD]">Quản trị trung tâm</p>
              <h1 className="mt-5 text-5xl font-black leading-[1.05]">
                Phân quyền admin cho toàn hệ thống.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">
                Đăng nhập để đăng ký dự án và quản lý quyền truy cập cho các admin/staff của QuanAo Shop.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Đăng ký dự án', 'Gán quyền admin', 'Audit đầy đủ'].map((item) => (
                <div key={item} className="rounded-xl border border-white/12 bg-white/10 p-4 text-sm font-black backdrop-blur">
                  <Shield size={19} className="mb-4 text-[#93C5FD]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right panel */}
        <section className="mx-auto w-full max-w-[520px]">
          <div className="mb-7 inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white">
              <Shirt size={24} />
            </span>
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.32em] text-[#2563EB]">Coolmate</span>
              <span className="block text-base font-black">Central Super Admin</span>
            </span>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] sm:p-9">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-black text-[#1D4ED8]">
              <Shield size={14} />
              Port 8100 · Quản trị trung tâm
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight">Đăng nhập</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Tài khoản super admin từ DA_Nest_BE (lyn25092004@gmail.com).
            </p>

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-bold">Email</label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                    placeholder="lyn25092004@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Mật khẩu</label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#2563EB]"
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
                {loading ? 'Đang đăng nhập...' : 'Vào quản trị trung tâm'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
