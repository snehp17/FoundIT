import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check if user has an allowed role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard if not allowed
      if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
      if (user.role === 'university_admin') return <Navigate to="/uni-admin" replace />;
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (err) {
    console.error("Invalid user data in local storage", err);
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}
