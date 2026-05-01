import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Mail,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Shirt,
  TicketPercent,
  Truck,
} from 'lucide-react';
import { useAdminSession } from '../hooks/useAdminSession';
import { useClientSession } from '../hooks/useClientSession';
import { useToast } from '../hooks/useToast';
import { loginAdmin } from '../lib/api';
import { loginClient } from '../lib/client-api';
import { refreshGlobalCart } from '../hooks/useCart';
import { useLanguage } from '../i18n/language-context';

type LoginMode = 'admin' | 'client';

const heroImages: Record<LoginMode, string> = {
  admin: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85',
  client: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85',
};

const modeCopy = {
  admin: {
    eyebrow: 'Quản trị cửa hàng',
    heroTitle: 'Điều hành sản phẩm, tồn kho và đơn hàng Coolmate.',
    heroDesc:
      'Khu vực dành cho quản trị viên và nhân viên vận hành. Dữ liệu đăng nhập được xác thực trực tiếp qua backend NestJS.',
    badge: 'Khu vực nội bộ',
    title: 'Đăng nhập quản trị',
    desc: 'Truy cập dashboard để quản lý sản phẩm, đơn hàng, cấu hình và báo cáo.',
    usernameLabel: 'Email quản trị',
    usernamePlaceholder: 'admin@coolmate.vn',
    passwordHint: 'Liên hệ admin nếu quên mật khẩu',
    button: 'Vào bảng quản trị',
    loading: 'Đang đăng nhập...',
    footer: 'Chỉ dành cho tài khoản admin hoặc nhân viên được cấp quyền.',
    switchLabel: 'Đăng nhập khách hàng',
    switchMode: 'client' as const,
  },
  client: {
    eyebrow: 'Tài khoản Coolmate',
    heroTitle: 'Lưu size, theo dõi đơn và mua lại nhanh hơn.',
    heroDesc:
      'Đăng nhập để đồng bộ giỏ hàng, xem lịch sử mua sắm, nhận voucher cá nhân và quản lý sản phẩm yêu thích.',
    badge: 'Mua sắm nhanh hơn',
    title: 'Đăng nhập Coolmate',
    desc: 'Xem đơn hàng, lưu sản phẩm yêu thích, dùng voucher và tiếp tục giỏ hàng của bạn.',
    usernameLabel: 'Tên đăng nhập hoặc email',
    usernamePlaceholder: 'Nhập email hoặc tên đăng nhập',
    passwordHint: 'Bảo mật tài khoản',
    button: 'Đăng nhập',
    loading: 'Đang đăng nhập...',
    footer: 'Dành cho khách hàng mua sắm tại Coolmate.',
    switchLabel: 'Đăng nhập quản trị',
    switchMode: 'admin' as const,
  },
};

const featureCards = {
  admin: [
    { icon: Boxes, title: 'Quản lý sản phẩm', desc: 'Theo dõi màu, size, tồn kho và SKU biến thể.' },
    { icon: Truck, title: 'Đơn hàng rõ trạng thái', desc: 'Kiểm soát thanh toán, giao hàng và đổi trả.' },
    { icon: BarChart3, title: 'Báo cáo vận hành', desc: 'Nắm doanh thu, khách hàng và hiệu quả bán hàng.' },
  ],
  client: [
    { icon: Truck, title: 'Giao hàng', desc: 'Theo dõi trạng thái giao hàng 2-4 ngày.' },
    { icon: RotateCcw, title: 'Đổi trả', desc: 'Quản lý yêu cầu đổi trả trong 7 ngày.' },
    { icon: TicketPercent, title: 'Voucher', desc: 'Lưu mã ưu đãi riêng cho tài khoản.' },
  ],
};

function getInitialMode(pathname: string): LoginMode {
  return pathname.includes('/client/login') ? 'client' : 'admin';
}

export default function LoginPage() {
  const { session: adminSession } = useAdminSession();
  const { session: clientSession } = useClientSession();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<LoginMode>(() => getInitialMode(location.pathname));
  const [adminUsername, setAdminUsername] = useState('admin@gmail.com');
  const [adminPassword, setAdminPassword] = useState('123456');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isVietnamese = language === 'vi';
  const copy = modeCopy[mode];
  const isAdmin = mode === 'admin';
  const username = isAdmin ? adminUsername : clientUsername;
  const password = isAdmin ? adminPassword : clientPassword;
  const rawFrom = (location.state as { from?: string } | null)?.from;
  const redirectTo = useMemo(() => {
    if (mode === 'admin') return rawFrom?.startsWith('/admin') ? rawFrom : '/admin';
    return rawFrom?.startsWith('/client') ? rawFrom : '/client';
  }, [mode, rawFrom]);

  useEffect(() => {
    setError(null);
    setShowPassword(false);
  }, [mode, username, password]);

  if (mode === 'admin' && adminSession) {
    return <Navigate to={redirectTo} replace />;
  }

  if (mode === 'client' && clientSession) {
    return <Navigate to={redirectTo} replace />;
  }

  function setUsername(value: string) {
    if (isAdmin) setAdminUsername(value);
    else setClientUsername(value);
  }

  function setPassword(value: string) {
    if (isAdmin) setAdminPassword(value);
    else setClientPassword(value);
  }

  function switchMode(nextMode: LoginMode) {
    if (nextMode === mode || loading) return;
    setMode(nextMode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'admin') {
        await loginAdmin(normalizedUsername, password);
        showToast({
          tone: 'success',
          title: isVietnamese ? 'Đăng nhập thành công' : 'Sign in successful',
          description: isVietnamese ? 'Bảng quản trị Coolmate đã sẵn sàng.' : 'Coolmate admin is ready.',
        });
      } else {
        await loginClient(normalizedUsername, password);
        await refreshGlobalCart();
      }

      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(message);
      if (mode === 'admin') {
        showToast({
          tone: 'error',
          title: isVietnamese ? 'Không thể đăng nhập' : 'Unable to sign in',
          description: message,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#0B0F19]">
      <div className="mx-auto min-h-screen max-w-[1520px] p-3 sm:p-4 lg:p-5">
        <div className="relative min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-xl border border-[#DCE4F0] bg-white shadow-[0_26px_90px_-55px_rgba(15,23,42,0.55)] lg:min-h-[calc(100vh-2.5rem)]">
          <section
            className={`relative z-10 flex min-h-[420px] overflow-hidden bg-[#0B0F19] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] lg:absolute lg:inset-y-0 lg:w-1/2 ${
              isAdmin ? 'lg:translate-x-0' : 'lg:translate-x-full'
            }`}
          >
            <img
              key={mode}
              src={heroImages[mode]}
              alt={isAdmin ? 'Coolmate admin operation' : 'Coolmate customer style'}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,15,25,0.92)_0%,rgba(11,15,25,0.72)_48%,rgba(11,15,25,0.38)_100%)]" />

            <div className={`relative z-10 flex w-full flex-col justify-between p-6 text-white sm:p-9 xl:p-12 ${isAdmin ? 'items-start text-left' : 'items-end text-right'}`}>
              <Link to="/client" className={`inline-flex items-center gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]">
                  <Shirt size={24} />
                </span>
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.32em] text-[#DBEAFE]">Coolmate</span>
                  <span className="block text-lg font-black">{isAdmin ? 'Admin Console' : 'Account'}</span>
                </span>
              </Link>

              <div className="max-w-xl py-10">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#93C5FD]">{copy.eyebrow}</p>
                <h1 className="mt-5 text-4xl font-black leading-[1.02] sm:text-5xl xl:text-6xl">
                  {copy.heroTitle}
                </h1>
                <p className={`mt-5 max-w-lg text-sm leading-7 text-white/75 ${isAdmin ? '' : 'ml-auto'}`}>
                  {copy.heroDesc}
                </p>
                {!isAdmin && (
                  <Link
                    to="/client/products"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#2563EB] transition hover:bg-[#DBEAFE]"
                  >
                    Xem sản phẩm
                    <ArrowRight size={17} />
                  </Link>
                )}
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3">
                {featureCards[mode].map((item) => (
                  <div key={item.title} className={`rounded-xl border border-white/12 bg-white/10 p-4 backdrop-blur ${isAdmin ? '' : 'text-right'}`}>
                    <item.icon size={20} className={`text-[#93C5FD] ${isAdmin ? '' : 'ml-auto'}`} />
                    <p className="mt-4 text-sm font-black">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/62">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`relative z-0 flex min-h-[calc(100vh-1.5rem)] items-center px-5 py-8 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] sm:px-8 lg:w-1/2 lg:px-12 ${
              isAdmin ? 'lg:ml-auto' : 'lg:mr-auto'
            }`}
          >
            <div className="mx-auto w-full max-w-[500px]">
              <div className="mb-7 flex items-center justify-between gap-4">
                <Link to="/client" className="inline-flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-white">
                    <Shirt size={21} />
                  </span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.28em] text-[#2563EB]">Coolmate</span>
                    <span className="block text-sm font-black">{isAdmin ? 'Quản trị hệ thống' : 'Tài khoản khách hàng'}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setLanguage(isVietnamese ? 'en' : 'vi')}
                  className="rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-black text-[#475569] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                >
                  {isVietnamese ? 'VI' : 'EN'}
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-1">
                <button
                  type="button"
                  onClick={() => switchMode('admin')}
                  className={`rounded-lg px-4 py-3 text-sm font-black transition ${
                    isAdmin ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#2563EB] hover:bg-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('client')}
                  className={`rounded-lg px-4 py-3 text-sm font-black transition ${
                    !isAdmin ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#2563EB] hover:bg-white'
                  }`}
                >
                  Khách hàng
                </button>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] sm:p-8">
                <div className="mb-6">
                  <p className="inline-flex items-center gap-2 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-black text-[#1D4ED8]">
                    {isAdmin ? <ShieldCheck size={14} /> : <PackageCheck size={14} />}
                    {copy.badge}
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">{copy.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{copy.desc}</p>
                </div>

                {error ? (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-bold">{copy.usernameLabel}</label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder={copy.usernamePlaceholder}
                        autoComplete="username"
                        className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-bold">Mật khẩu</label>
                      <span className="text-xs font-semibold text-gray-400">{copy.passwordHint}</span>
                    </div>
                    <div className="relative">
                      <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Nhập mật khẩu"
                        autoComplete="current-password"
                        className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-12 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
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

                  {!isAdmin ? (
                    <div className="grid gap-2 rounded-xl bg-[#F8FAFC] p-4 text-sm text-gray-600 sm:grid-cols-3">
                      {[
                        { icon: Truck, text: 'Giao hàng' },
                        { icon: RotateCcw, text: 'Đổi trả' },
                        { icon: Heart, text: 'Yêu thích' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 font-semibold">
                          <item.icon size={15} className="text-[#2563EB]" />
                          {item.text}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-black text-white shadow-[0_18px_35px_-20px_rgba(37,99,235,0.85)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <LoaderCircle size={17} className="animate-spin" /> : null}
                    {loading ? copy.loading : copy.button}
                  </button>
                </form>

                {!isAdmin ? (
                  <p className="mt-6 text-center text-sm text-gray-500">
                    Chưa có tài khoản?{' '}
                    <Link to="/client/register" className="font-black text-[#2563EB] hover:underline">
                      Đăng ký ngay
                    </Link>
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-2 text-center text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <span>{copy.footer}</span>
                <button
                  type="button"
                  onClick={() => switchMode(copy.switchMode)}
                  className="font-bold text-[#2563EB] hover:underline"
                >
                  {copy.switchLabel}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
