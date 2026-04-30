import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/language-context';

export default function NotFound() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';

  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-on-surface">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-on-surface/10 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-primary">
          {isVietnamese ? 'Không tìm thấy trang' : 'Page not found'}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
          {isVietnamese
            ? 'Route này chưa được cấu hình trong cấu trúc giao diện mới.'
            : 'This route has not been configured in the new frontend structure yet.'}
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/admin"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-container"
          >
            {isVietnamese ? 'Về quản trị' : 'Back to admin'}
          </Link>
          <Link
            to="/client"
            className="rounded-full border border-on-surface/10 px-5 py-3 text-sm font-semibold text-on-surface transition hover:border-primary/30 hover:text-primary"
          >
            {isVietnamese ? 'Về client' : 'Back to client'}
          </Link>
        </div>
      </div>
    </div>
  );
}


