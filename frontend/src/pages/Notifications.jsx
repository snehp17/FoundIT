import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { Brain, CheckCircle2, Bell, Info, Check, Trash2, Filter } from 'lucide-react'
import api from '../api'

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.round(diffInMs / 60000);
  if (diffInMins < 60) return `${diffInMins || 1} minutes ago`;
  const diffInHours = Math.round(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function getGroup(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInDays < 1 && date.getDate() === now.getDate()) return 'Today';
  if (diffInDays < 2) return 'Yesterday';
  if (diffInDays < 7) return 'This Week';
  return 'Older';
}

function getIconForType(type) {
  if (type === 'match') return Brain;
  if (type === 'system') return Info;
  if (type === 'alert') return Bell;
  return CheckCircle2; 
}

function getColorForType(type) {
  if (type === 'match') return 'text-primary bg-primary/10';
  if (type === 'system') return 'text-secondary-500 bg-secondary-100';
  if (type === 'alert') return 'text-warning bg-warning/10';
  return 'text-accent bg-accent/10'; 
}

export default function Notifications() {
  const [filter, setFilter] = useState('all')
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications();
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifs(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  }

  const dismiss = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error dismissing notification', err);
    }
  }

  const filtered = notifs.filter(n => {
    if (filter === 'matches') return n.type === 'match'
    if (filter === 'claims') return n.type === 'verify'
    if (filter === 'system') return n.type === 'system'
    return true
  })

  const unread = notifs.filter(n => !n.is_read).length
  const groups = [...new Set(filtered.map(n => getGroup(n.created_at)))]

  return (
    <AppLayout title="Notifications">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">Notifications</h2>
            {unread > 0 && <p className="text-sm text-secondary-500">{unread} unread notifications</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-sm gap-2">
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex bg-secondary-100 rounded-xl p-1 gap-0.5 w-fit">
          {['all', 'matches', 'claims', 'system'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === t ? 'bg-surface text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {loading ? (
          <div className="text-center py-20 bg-surface rounded-3xl border border-secondary-100">
            <p className="text-secondary-400 mt-1">Loading notifications...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-3xl border border-secondary-100">
            <Bell className="w-16 h-16 text-secondary-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900">All caught up!</h3>
            <p className="text-secondary-400 mt-1">No notifications to show.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">{group}</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {filtered.filter(n => getGroup(n.created_at) === group).map(notif => {
                    const Icon = getIconForType(notif.type);
                    const colorClass = getColorForType(notif.type);
                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        className={`bg-surface rounded-2xl border shadow-md p-4 flex items-start gap-4 ${notif.is_read ? 'border-secondary-100' : 'border-primary/20 bg-primary-50/30'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${notif.is_read ? 'text-secondary-900' : 'text-secondary-900'}`}>
                              {!notif.is_read && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}
                              {notif.title}
                            </h4>
                            <span className="text-xs text-secondary-400 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                          </div>
                          <p className="text-sm text-secondary-500 mt-0.5">{notif.message}</p>
                        </div>
                        <button onClick={() => dismiss(notif.id)} className="p-1.5 rounded-lg hover:bg-error/10 hover:text-error text-secondary-300 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}
