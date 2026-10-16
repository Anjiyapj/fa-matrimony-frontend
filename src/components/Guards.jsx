import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './ui';

/* Member pages. On-hold members may only open My Profile (allowHold). */
export function RequireMember({ children, allowHold = false }) {
  const { loading, isMember, user } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading full />;
  if (!isMember) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (user.status === 'on_hold' && !allowHold) return <Navigate to="/my-profile?hold=1" replace />;
  return children;
}
export function RequireAdmin({ children }) {
  const { loading, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading full />;
  if (!isAdmin) return <Navigate to={`/login?role=admin&next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}
