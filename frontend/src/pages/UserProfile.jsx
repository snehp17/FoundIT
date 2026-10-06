import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { User, Mail, Phone, Building2, Shield, Camera, CheckCircle2, Star, Package, TrendingUp, Award, Users, Key, BookOpen, GraduationCap, Lock } from 'lucide-react'
import api from '../api'

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  const [form, setForm] = useState({
    name: 'User',
    email: '',
    phone: '',
    university: 'Platform Administrator',
    rollNo: '',
    department: '',
    batch: ''
  })

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const fetchProfile = async () => {
    try {
      const userStr = localStorage.getItem('user')
      let localUser = null
      if (userStr) {
        localUser = JSON.parse(userStr)
        setUser(localUser)
      }

      const res = await api.get('/auth/profile')
      const p = res.data
      setForm({
        name: p.name || localUser?.name || 'User',
        email: p.email || localUser?.email || '',
        phone: p.phone || '',
        university: p.university || localUser?.university || 'Parul University',
        rollNo: p.roll_number || '',
        department: p.department || '',
        batch: p.batch || ''
      })
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setProfileMsg('')
    setProfileError('')
    setSavingProfile(true)
    try {
      await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        department: form.department,
        roll_number: form.rollNo,
        batch: form.batch
      })
      setProfileMsg('Profile details updated successfully!')
      setEditing(false)
      // Update local storage user name/phone
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const parsed = JSON.parse(userStr)
        localStorage.setItem('user', JSON.stringify({ ...parsed, name: form.name }))
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await api.post('/auth/change-password', {
        newPassword: passwordForm.newPassword
      })
      setPasswordMsg('Password changed successfully!')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const isSuperAdmin = user?.role === 'super_admin'
  const isUniAdmin = user?.role === 'university_admin'
  const isAdmin = isSuperAdmin || isUniAdmin

  // Stats for Admin vs Student
  const stats = isAdmin ? [
    { icon: Users, label: 'Platform Users', value: '1,204', color: 'text-primary bg-primary/10' },
    { icon: Building2, label: 'Universities', value: '5', color: 'text-accent bg-accent/10' },
    { icon: Package, label: 'Total Items', value: '843', color: 'text-warning bg-warning/10' },
    { icon: Shield, label: 'Security Score', value: '100%', color: 'text-purple-600 bg-purple-100' },
  ] : [
    { icon: Package, label: 'Reports Submitted', value: '7', color: 'text-primary bg-primary/10' },
    { icon: CheckCircle2, label: 'Items Recovered', value: '4', color: 'text-accent bg-accent/10' },
    { icon: TrendingUp, label: 'Items Helped Find', value: '3', color: 'text-warning bg-warning/10' },
    { icon: Star, label: 'Trust Score', value: '4.9', color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <AppLayout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden"
        >
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-primary to-violet-600 relative" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
              <div className="relative -mt-10 self-start sm:self-auto">
                <div className={`w-20 h-20 rounded-2xl ${isSuperAdmin ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'} border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold uppercase`}>
                  {form.name ? form.name.substring(0, 2) : 'US'}
                </div>
              </div>
              <div className="pb-1 flex-1">
                <h2 className="text-xl font-bold text-secondary-900">{form.name}</h2>
                <div className="flex items-center gap-2 text-secondary-500 text-sm">
                  <Building2 className="w-4 h-4" />
                  {isSuperAdmin ? 'Platform Administrator' : form.university}
                </div>
              </div>
              <div className="pb-1 flex items-center gap-3">
                <div className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold ${
                  isSuperAdmin ? 'bg-purple-100 text-purple-700' : 
                  isUniAdmin ? 'bg-blue-100 text-blue-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'Super Admin' : isUniAdmin ? 'University Admin' : 'Verified Student'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="bg-secondary-50 rounded-2xl p-3 text-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold text-secondary-900">{stat.value}</div>
                  <div className="text-xs text-secondary-400 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Edit Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-secondary-900">Student Verification & Profile Information</h3>
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="btn-primary btn-sm"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary btn-sm"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {profileMsg && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-200">
                  {profileMsg}
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-xs border border-error/20">
                  {profileError}
                </div>
              )}

              <div className="space-y-4">
                {[
                  { icon: User, label: 'Full Name', key: 'name', type: 'text', show: true, editable: true },
                  { icon: Mail, label: 'University Email', key: 'email', type: 'email', show: true, editable: false },
                  { icon: Phone, label: 'Phone Number', key: 'phone', type: 'tel', show: true, editable: true, placeholder: '+91 9876543210' },
                  { icon: Building2, label: 'University', key: 'university', type: 'text', show: !isSuperAdmin, editable: false },
                  { icon: Shield, label: 'Roll Number / Student ID', key: 'rollNo', type: 'text', show: !isAdmin, editable: true, placeholder: '2303031050445' },
                  { icon: BookOpen, label: 'Department / Branch', key: 'department', type: 'text', show: !isAdmin, editable: true, placeholder: 'Computer Science & Engineering' },
                  { icon: GraduationCap, label: 'Graduation Batch', key: 'batch', type: 'text', show: !isAdmin, editable: true, placeholder: '2027' },
                ].filter(f => f.show).map(field => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
                      <field.icon className="w-4 h-4 text-secondary-500" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">{field.label}</label>
                      {editing && field.editable ? (
                        <input
                          type={field.type}
                          value={form[field.key]}
                          placeholder={field.placeholder}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                          className="input-field mt-1 py-2"
                        />
                      ) : (
                        <p className="text-sm font-medium text-secondary-900 mt-0.5">
                          {form[field.key] || <span className="text-secondary-400 font-normal italic">Not specified</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password Box */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
              <h3 className="font-semibold text-secondary-900 mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Security & Password Settings
              </h3>
              <p className="text-xs text-secondary-500 mb-4">
                Update your account password. If you signed in using the default initial password, we recommend changing it.
              </p>

              {passwordMsg && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-200">
                  {passwordMsg}
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-xs border border-error/20">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Enter new password (min. 8 characters)"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-500 mb-1 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={savingPassword} className="btn-primary py-2 px-4 text-sm">
                    {savingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Activity + Badges Sidebar */}
          <div className="space-y-4">
            {/* Verification Status */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-3 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" /> Account Status
              </h3>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Official Campus Account
                </p>
                <p className="text-emerald-600">
                  Verified with {form.university || 'University'} Domain Security.
                </p>
              </div>
            </div>

            {/* Badges */}
            {!isAdmin && (
              <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
                <h3 className="font-semibold text-secondary-900 mb-4 text-sm">Earned Badges</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: '🏆', label: 'First Recovery' },
                    { emoji: '⭐', label: 'Top Finder' },
                    { emoji: '🛡️', label: 'Verified' },
                    { emoji: '🤝', label: 'Community Hero' },
                    { emoji: '🔥', label: '5 Reports' },
                    { emoji: '💎', label: 'Trust Elite' },
                  ].map((badge) => (
                    <div key={badge.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary-50 hover:bg-primary-50 transition-colors cursor-pointer group">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{badge.emoji}</span>
                      <span className="text-xs text-secondary-400 text-center leading-tight">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
