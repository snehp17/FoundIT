import { useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { Shield, Check, X, Eye, AlertTriangle, Clock, Flag, ChevronRight, Search } from 'lucide-react'

const queue = [
  { id: 1, reporter: 'S2847', item: 'MacBook Pro 14"', claimant: 'S3021', time: '15m ago', status: 'Pending', risk: 'Low' },
  { id: 2, reporter: 'S1190', item: 'Student ID Card', claimant: 'S4452', time: '45m ago', status: 'Flagged', risk: 'High' },
  { id: 3, reporter: 'S8832', item: 'Blue Hydroflask', claimant: 'S2210', time: '2h ago', status: 'Pending', risk: 'Low' },
  { id: 4, reporter: 'S5501', item: 'Gold Ring', claimant: 'S7790', time: '3h ago', status: 'Pending', risk: 'Medium' },
]

const activityLog = [
  { action: 'Approved claim', item: 'AirPods Pro', by: 'Mod Raj', time: '10m ago', type: 'approve' },
  { action: 'Flagged suspicious claim', item: 'Laptop Bag', by: 'Mod Raj', time: '1h ago', type: 'flag' },
  { action: 'Rejected fraudulent claim', item: 'iPhone 14', by: 'Mod Priya', time: '3h ago', type: 'reject' },
  { action: 'Approved claim', item: 'Keys Bundle', by: 'Mod Raj', time: '5h ago', type: 'approve' },
]

export default function ModeratorDashboard() {
  const [items, setItems] = useState(queue)

  const approve = (id) => setItems(prev => prev.filter(i => i.id !== id))
  const reject = (id) => setItems(prev => prev.filter(i => i.id !== id))
  const flag = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Flagged', risk: 'High' } : i))

  return (
    <AppLayout title="Moderator Dashboard">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: 'Pending Review', value: items.filter(i => i.status === 'Pending').length, color: 'text-warning', bg: 'bg-warning/10' },
            { icon: Flag, label: 'Flagged Cases', value: items.filter(i => i.status === 'Flagged').length, color: 'text-error', bg: 'bg-error/10' },
            { icon: Check, label: 'Approved Today', value: '14', color: 'text-accent', bg: 'bg-accent/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-secondary-500">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verification Queue */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-secondary-900">Verification Queue</h3>
              <span className="badge-error text-xs">{items.length} pending</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input-field py-2 pl-9 text-sm w-48" placeholder="Search..." />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <Check className="w-16 h-16 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900">All clear!</h3>
              <p className="text-secondary-400">No pending verifications. Great work!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Reporter', 'Item', 'Claimant', 'Time', 'Risk', 'Status', 'Actions'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <motion.tr
                      key={item.id}
                      layout
                      exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-secondary-50 transition-colors"
                    >
                      <td className="table-cell font-medium text-secondary-900">#{item.reporter}</td>
                      <td className="table-cell">{item.item}</td>
                      <td className="table-cell">#{item.claimant}</td>
                      <td className="table-cell text-secondary-400 text-xs">{item.time}</td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${
                          item.risk === 'High' ? 'badge-error' :
                          item.risk === 'Medium' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {item.risk}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${item.status === 'Flagged' ? 'badge-error' : 'badge-primary'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 text-secondary-400 hover:text-primary transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => approve(item.id)} className="p-1.5 rounded-lg hover:bg-accent/10 text-secondary-400 hover:text-accent transition-colors" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => reject(item.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-secondary-400 hover:text-error transition-colors" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => flag(item.id)} className="p-1.5 rounded-lg hover:bg-warning/10 text-secondary-400 hover:text-warning transition-colors" title="Flag">
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Today's Activity Log</h3>
          <div className="space-y-3">
            {activityLog.map((log, i) => (
              <div key={i} className="flex items-center gap-4 py-2.5 border-b border-secondary-100 last:border-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  log.type === 'approve' ? 'bg-accent/10 text-accent' :
                  log.type === 'reject' ? 'bg-error/10 text-error' :
                  'bg-warning/10 text-warning'
                }`}>
                  {log.type === 'approve' ? <Check className="w-4 h-4" /> :
                   log.type === 'reject' ? <X className="w-4 h-4" /> :
                   <Flag className="w-4 h-4" />}
                </div>
                <div className="flex-1 text-sm">
                  <span className="font-medium text-secondary-900">{log.action}</span>
                  <span className="text-secondary-400"> · {log.item}</span>
                </div>
                <div className="text-xs text-secondary-400">{log.by}</div>
                <div className="text-xs text-secondary-400">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
