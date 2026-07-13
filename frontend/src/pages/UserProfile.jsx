import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { User, Mail, Phone, Building2, Shield, Camera, CheckCircle2, Star, Package, TrendingUp, Award, Users } from 'lucide-react'
import api from '../api'

export default function UserProfile() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        setUser(parsed)
        setForm({
          name: parsed?.name || 'User',
          email: parsed?.email || '',
          phone: parsed?.phone || '',
          university: parsed?.university?.name || 'Platform Administrator',
          rollNo: parsed?.roll_number || '',
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('activity')
  const [form, setForm] = useState({
    name: 'User',
    email: '',
    phone: '',
    university: 'Platform Administrator',
    rollNo: '',
  })
  
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

  const activity = isAdmin ? [
    { icon: Shield, text: 'System security scan completed', time: '2h ago', type: 'recovered' },
    { icon: Building2, text: 'New university partnership approved', time: '1d ago', type: 'found' },
  ] : [
    { icon: Package, text: 'Reported lost MacBook Pro 14"', time: '2h ago', type: 'lost' },
    { icon: CheckCircle2, text: 'AirPods successfully recovered', time: '3d ago', type: 'recovered' },
    { icon: Star, text: 'Received 5-star review from Finder #F2847', time: '5d ago', type: 'review' },
    { icon: Package, text: 'Reported found Blue Hydroflask', time: '1w ago', type: 'found' },
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
                  {form.name.substring(0, 2)}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-surface rounded-xl border border-secondary-200 shadow flex items-center justify-center hover:bg-secondary-50 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-secondary-500" />
                </button>
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
          {/* Edit Profile */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-secondary-900">Profile Information</h3>
              <button
                onClick={() => setEditing(!editing)}
                className={editing ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            <div className="space-y-4">
              {[
                { icon: User, label: 'Full Name', key: 'name', type: 'text', show: true },
                { icon: Mail, label: 'Email Address', key: 'email', type: 'email', show: true },
                { icon: Phone, label: 'Phone Number', key: 'phone', type: 'tel', show: true },
                { icon: Building2, label: 'University', key: 'university', type: 'text', show: !isSuperAdmin },
                { icon: Shield, label: 'Roll Number', key: 'rollNo', type: 'text', show: !isAdmin },
              ].filter(f => f.show).map(field => (
                <div key={field.key} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
                    <field.icon className="w-4 h-4 text-secondary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">{field.label}</label>
                    {editing ? (
                      <input
                        type={field.type}
                        value={form[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        className="input-field mt-1 py-2"
                        disabled={field.key === 'email' || field.key === 'university'}
                      />
                    ) : (
                      <p className="text-sm font-medium text-secondary-900 mt-0.5">{form[field.key]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity + Badges */}
          <div className="space-y-4">
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

            {/* Recent Activity */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 text-sm">Recent Activity</h3>
              <div className="space-y-3">
                {activity.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      act.type === 'recovered' ? 'bg-accent/10 text-accent' :
                      act.type === 'review' ? 'bg-warning/10 text-warning' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary-700">{act.text}</p>
                      <p className="text-xs text-secondary-400">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
