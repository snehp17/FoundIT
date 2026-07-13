import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, ArrowRight, Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2, Zap } from 'lucide-react'
import api from '../api'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', universityId: '' })
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await api.get('/auth/universities');
        setUniversities(response.data);
        if (response.data.length > 0) {
          setForm(prev => ({ ...prev, universityId: response.data[0].id }));
        }
      } catch (error) {
        console.error("Failed to fetch universities", error);
      }
    };
    fetchUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (tab === 'login') {
        const response = await api.post('/auth/login', {
          usernameOrEmail: form.email,
          password: form.password
        });
        localStorage.setItem('user', JSON.stringify(response.data));
        // Add token to api header globally or let interceptor handle it
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        if (response.data.role === 'super_admin') {
          navigate('/admin')
        } else if (response.data.role === 'university_admin') {
          navigate('/uni-admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        // Register
        await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          universityId: form.universityId
        });
        
        // Auto-login or redirect
        alert("Registration successful! Please login.");
        setTab('login');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false)
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

  const strength = passwordStrength(form.password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-error', 'bg-warning', 'bg-primary', 'bg-accent'][strength]

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-secondary-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-xl font-display font-bold text-white">Found<span className="text-primary-400">IT</span></span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
              Reconnecting students<br />
              with their <span className="text-gradient-accent">lost belongings</span>
            </h2>
            <p className="text-secondary-400 text-lg mb-10 max-w-md">
              Join thousands of students who have successfully recovered their items using AI-powered matching and secure verification.
            </p>
            <div className="space-y-4">
              {[
                '78% average campus recovery rate',
                'Ownership verified before every handover',
                'Your data never shared without consent',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-secondary-300 text-sm">{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '12K+', label: 'Students' },
            { value: '20', label: 'Campuses' },
            { value: '78%', label: 'Recovery Rate' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface/10 rounded-2xl p-4 backdrop-blur">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-secondary-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo - mobile */}
          <Link to="/" className="flex items-center gap-2.5 lg:hidden mb-8">
            <span className="text-lg font-display font-bold text-secondary-900">Found<span className="text-primary">IT</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-secondary-900 mb-2">
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-secondary-500">
              {tab === 'login' ? "Sign in to continue to your campus dashboard." : "Join your campus recovery ecosystem today."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-secondary-100 rounded-2xl p-1 mb-8">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  tab === t ? 'bg-surface text-secondary-900 shadow-md' : 'text-secondary-500 hover:text-secondary-900'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {/* Google Button */}
          <button className="w-full flex items-center justify-center gap-3 py-3 border border-secondary-200 rounded-2xl hover:bg-secondary-50 transition-all duration-200 mb-6 font-medium text-secondary-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-secondary-200" />
            <span className="text-xs text-secondary-400 font-medium">or</span>
            <div className="flex-1 h-px bg-secondary-200" />
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {tab === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Full name"
                    className="input-field pl-11"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={tab === 'login' ? 'text' : 'email'}
                  placeholder={tab === 'login' ? 'Email or Admin ID' : 'University email address'}
                  className="input-field pl-11"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              {tab === 'register' && form.universityId && (
                <div className="text-xs text-secondary-500 pl-1">
                  {(() => {
                    const uni = universities.find(u => u.id === form.universityId);
                    if (uni) {
                      return uni.allow_personal_emails
                        ? "You can use any email address."
                        : `Please use your official email ending in ${uni.allowed_domain}`;
                    }
                    return null;
                  })()}
                </div>
              )}

              {tab === 'register' && (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <select
                    className="input-field pl-11 appearance-none"
                    value={form.universityId}
                    onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select your university</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  className="input-field pl-11 pr-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {tab === 'register' && form.password && (
                <div>
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

              {tab === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-primary hover:text-primary-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              {tab === 'register' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-secondary-300 text-primary" />
                  <span className="text-sm text-secondary-500">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                {loading ? 'Processing...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-sm text-secondary-500 mt-6">
            {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
              className="text-primary hover:text-primary-700 font-semibold"
            >
              {tab === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
