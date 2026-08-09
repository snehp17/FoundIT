import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const userStr = localStorage.getItem('user');
  const location = useLocation();

  // Not logged in — send to login and remember where they wanted to go
  if (!userStr) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Logged in but wrong role — redirect to their own dashboard, NOT /profile
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
      if (user.role === 'university_admin') return <Navigate to="/uni-admin" replace />;
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (err) {
    console.error('Invalid user data in localStorage', err);
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}
