import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminSession } from '../../hooks/useAdminSession';
import { refreshAdminSession } from '../../lib/api';
import { useLanguage } from '../../i18n/language-context';

export default function ProtectedAdminRoute() {
  const { session } = useAdminSession();
  const location = useLocation();
  const { language } = useLanguage();
  const [checking, setChecking] = useState(!session);
  const isVietnamese = language === 'vi';

  useEffect(() => {
    if (session) {
      setChecking(false);
      return;
    }

    let active = true;

    refreshAdminSession()
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session]);

  if (checking) {
    return (
      <div className="p-6 text-sm text-on-surface-variant">
        {isVietnamese ? 'Đang kiểm tra phiên quản trị...' : 'Checking admin session...'}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
