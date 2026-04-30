import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminSession } from '../../hooks/useAdminSession';

export default function ProtectedAdminRoute() {
  const { session } = useAdminSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

