import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { Loader2, ShieldX, ArrowLeft } from 'lucide-react';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Supabase puts tokens in the hash during implicit grant
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');

    if (access_token) {
      // Call backend to complete login and get profile
      api.post('/auth/google-callback', { access_token })
        .then(res => {
          localStorage.setItem('user', JSON.stringify(res.data));
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          if (res.data.role === 'super_admin') navigate('/admin', { replace: true });
          else if (res.data.role === 'university_admin') navigate('/uni-admin', { replace: true });
          else navigate('/dashboard', { replace: true });
        })
        .catch(err => {
          console.error(err);
          const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
          setErrorMsg(msg);
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-surface rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldX className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-2xl font-display font-bold text-secondary-900 mb-3">
            Access Restricted
          </h2>
          <p className="text-secondary-500 text-sm leading-relaxed mb-6">
            {errorMsg}
          </p>
          <Link
            to="/login"
            className="btn-primary w-full justify-center py-3 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center p-8"
      >
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-secondary-900">Logging you in...</h2>
        <p className="text-secondary-500 mt-2 text-sm">Please wait while we set up your session.</p>
      </motion.div>
    </div>
  );
}
