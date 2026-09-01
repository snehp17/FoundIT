import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [tokenType, setTokenType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token on mount to prevent loss from navigation/reloads
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const search = window.location.search;
    const queryParams = new URLSearchParams(search);
    
    const at = hashParams.get('access_token');
    const c = queryParams.get('code');
    
    if (c) {
      setResetToken(c);
      setTokenType('code');
    } else if (at) {
      setResetToken(at);
      setTokenType('access_token');
    } else {
      setErrorMsg("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, []);

  // Validate strong password
  const strongPasswordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strongPasswordRegex.test(password)) {
      setErrorMsg("Weak password");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      if (!resetToken) {
         setErrorMsg("Invalid or missing reset token. Please request a new link.");
         setLoading(false);
         return;
      }
      
      await api.post('/auth/reset-password', {
         token: resetToken,
         type: tokenType,
         password: password
      });
      
      setSuccessMsg("Password updated successfully! Redirecting...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = (pwd) => {
    if (pwd.length === 0) return 0
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strength = passwordStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-error', 'bg-warning', 'bg-primary', 'bg-accent'][strength]

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-secondary-100"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-secondary-900">Reset Password</h2>
        
        {errorMsg && (
          <div className="mb-6 p-3 bg-error/10 border border-error/20 text-error rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary-700">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type={showPass ? "text" : "password"}
                required
                className="input-field pl-11"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {password && (
            <div className="mb-4">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-secondary-200'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-secondary-400">Password strength: <span className="font-medium">{strengthLabel}</span></p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-6">
            {loading ? 'Updating...' : 'Update Password'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
