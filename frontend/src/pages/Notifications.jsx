import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { Brain, CheckCircle2, Bell, Info, Check, Trash2, Filter } from 'lucide-react'

const notifications = [
  {
    id: 1, type: 'match', icon: Brain, color: 'text-primary bg-primary/10',
    title: '94% AI Match Found!',
    body: 'Your lost Student ID Card matches a found item at the Bus Stop area.',
    time: '5 minutes ago', read: false, group: 'Today',
  },
  {
    id: 2, type: 'verify', icon: CheckCircle2, color: 'text-accent bg-accent/10',
    title: 'Claim Approved',
    body: 'Your ownership claim for MacBook Pro 14" has been verified by the moderator.',
    time: '1 hour ago', read: false, group: 'Today',
  },
  {
    id: 3, type: 'alert', icon: Bell, color: 'text-warning bg-warning/10',
    title: 'New Found Item Near You',
    body: 'A black backpack was found in the Parking Area — could this be yours?',
    time: '3 hours ago', read: false, group: 'Today',
  },
  {
    id: 4, type: 'info', icon: Info, color: 'text-secondary-500 bg-secondary-100',
    title: 'Verification Reminder',
    body: 'You have a pending claim for Blue Hydroflask. Answer verification questions to proceed.',
    time: 'Yesterday, 4:20 PM', read: true, group: 'Yesterday',
  },
  {
    id: 5, type: 'verify', icon: CheckCircle2, color: 'text-accent bg-accent/10',
    title: 'Recovery Completed!',
    body: 'Great news! Your AirPods have been successfully recovered. Thanks for using FoundIT! 🎉',
    time: 'Yesterday, 2:15 PM', read: true, group: 'Yesterday',
  },
]

export default function Notifications() {
  const [filter, setFilter] = useState('all')
  const [notifs, setNotifs] = useState(notifications)

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const dismiss = (id) => setNotifs(prev => prev.filter(n => n.id !== id))

  const filtered = notifs.filter(n => {
    if (filter === 'matches') return n.type === 'match'
    if (filter === 'claims') return n.type === 'verify'
    if (filter === 'system') return n.type === 'info'
    return true
  })

  const unread = notifs.filter(n => !n.read).length

  const groups = [...new Set(filtered.map(n => n.group))]

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
        {groups.length === 0 ? (
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
                  {filtered.filter(n => n.group === group).map(notif => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className={`bg-surface rounded-2xl border shadow-md p-4 flex items-start gap-4 ${notif.read ? 'border-secondary-100' : 'border-primary/20 bg-primary-50/30'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${notif.read ? 'text-secondary-900' : 'text-secondary-900'}`}>
                            {!notif.read && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}
                            {notif.title}
                          </h4>
                          <span className="text-xs text-secondary-400 flex-shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-sm text-secondary-500 mt-0.5">{notif.body}</p>
                      </div>
                      <button onClick={() => dismiss(notif.id)} className="p-1.5 rounded-lg hover:bg-error/10 hover:text-error text-secondary-300 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}
