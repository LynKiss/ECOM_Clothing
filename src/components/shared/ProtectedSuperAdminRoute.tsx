import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSuperAdminSession } from '../../hooks/useSuperAdminSession';

export default function ProtectedSuperAdminRoute() {
  const { session } = useSuperAdminSession();
  const location = useLocation();

  if (!session) {
    return (
      <Navigate to="/super-login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
