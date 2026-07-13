import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { Shield, Check, X, Eye, AlertTriangle, Clock, Flag, ChevronRight, Search, Calendar } from 'lucide-react'

// Helper to get past dates for dummy data
const getPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const queue = [
  { id: 1, reporter: 'S2847', item: 'MacBook Pro 14"', claimant: 'S3021', time: '15m ago', status: 'Pending', risk: 'Low' },
  { id: 2, reporter: 'S1190', item: 'Student ID Card', claimant: 'S4452', time: '45m ago', status: 'Flagged', risk: 'High' },
  { id: 3, reporter: 'S8832', item: 'Blue Hydroflask', claimant: 'S2210', time: '2h ago', status: 'Pending', risk: 'Low' },
  { id: 4, reporter: 'S5501', item: 'Gold Ring', claimant: 'S7790', time: '3h ago', status: 'Pending', risk: 'Medium' },
]

const initialLog = [
  { id: 101, action: 'Approved claim', item: 'AirPods Pro', by: 'Mod Raj', time: getPastDate(0), type: 'approve' },
  { id: 102, action: 'Flagged suspicious claim', item: 'Laptop Bag', by: 'Mod Raj', time: getPastDate(1), type: 'flag' },
  { id: 103, action: 'Rejected fraudulent claim', item: 'iPhone 14', by: 'Mod Priya', time: getPastDate(3), type: 'reject' },
  { id: 104, action: 'Approved claim', item: 'Keys Bundle', by: 'Mod Raj', time: getPastDate(10), type: 'approve' },
]

export default function ModeratorDashboard() {
  const [items, setItems] = useState(queue)
  const [log, setLog] = useState(initialLog)
  const [filterType, setFilterType] = useState('today') // today, yesterday, week, month, specific, range
  const [specificDate, setSpecificDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  const addToLog = (action, item, type) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      action: action,
      item: item,
      by: 'You',
      time: new Date().toISOString(),
      type: type
    }
    setLog(prev => [newEntry, ...prev])
  }

  const approve = (id) => {
    const item = items.find(i => i.id === id)
    if(item) {
      setItems(prev => prev.filter(i => i.id !== id))
      addToLog('Approved claim', item.item, 'approve')
    }
  }
  
  const reject = (id) => {
    const item = items.find(i => i.id === id)
    if(item) {
      setItems(prev => prev.filter(i => i.id !== id))
      addToLog('Rejected fraudulent claim', item.item, 'reject')
    }
  }
  
  const flag = (id) => {
    const item = items.find(i => i.id === id)
    if(item && item.status !== 'Flagged') {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Flagged', risk: 'High' } : i))
      addToLog('Flagged suspicious claim', item.item, 'flag')
    }
  }

  // Filter logic
  const filteredLog = log.filter(entry => {
    const entryDate = new Date(entry.time);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (filterType === 'today') {
      return entryDate >= today;
    } else if (filterType === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return entryDate >= yesterday && entryDate < today;
    } else if (filterType === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    } else if (filterType === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return entryDate >= monthAgo;
    } else if (filterType === 'specific') {
      if (!specificDate) return true;
      const spec = new Date(specificDate);
      return entryDate.toDateString() === spec.toDateString();
    } else if (filterType === 'range') {
      if (!startDate && !endDate) return true;
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      start.setHours(0,0,0,0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23,59,59,999);
      return entryDate >= start && entryDate <= end;
    }
    return true;
  });

  // format time helper
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now - d) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  }

  return (
    <AppLayout title="Moderator Dashboard">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: 'Pending Review', value: items.filter(i => i.status === 'Pending').length, color: 'text-warning', bg: 'bg-warning/10' },
            { icon: Flag, label: 'Flagged Cases', value: items.filter(i => i.status === 'Flagged').length, color: 'text-error', bg: 'bg-error/10' },
            { icon: Check, label: 'Approved Today', value: log.filter(l => l.type === 'approve' && new Date(l.time) >= new Date().setHours(0,0,0,0)).length, color: 'text-accent', bg: 'bg-accent/10' },
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
                  <AnimatePresence>
                    {items.map(item => (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 1 }}
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
                            <button onClick={() => setSelectedItem(item)} className="p-1.5 rounded-lg hover:bg-primary/10 text-secondary-400 hover:text-primary transition-colors" title="View">
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
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Activity Log
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field py-1.5 px-3 text-sm border border-secondary-200 rounded-lg outline-none"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
              </select>
              
              {filterType === 'specific' && (
                <input 
                  type="date" 
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="input-field py-1.5 px-3 text-sm border border-secondary-200 rounded-lg outline-none"
                />
              )}
              
              {filterType === 'range' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field py-1.5 px-3 text-sm border border-secondary-200 rounded-lg outline-none"
                  />
                  <span className="text-secondary-400 text-sm">to</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field py-1.5 px-3 text-sm border border-secondary-200 rounded-lg outline-none"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {filteredLog.map((entry) => (
                <motion.div 
                  key={entry.id} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 py-2.5 border-b border-secondary-100 last:border-0"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    entry.type === 'approve' ? 'bg-accent/10 text-accent' :
                    entry.type === 'reject' ? 'bg-error/10 text-error' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {entry.type === 'approve' ? <Check className="w-4 h-4" /> :
                     entry.type === 'reject' ? <X className="w-4 h-4" /> :
                     <Flag className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-secondary-900">{entry.action}</span>
                    <span className="text-secondary-400"> · {entry.item}</span>
                  </div>
                  <div className="text-xs text-secondary-400 w-20 truncate">{entry.by}</div>
                  <div className="text-xs text-secondary-400 w-24 text-right">{formatTime(entry.time)}</div>
                </motion.div>
              ))}
              {filteredLog.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-secondary-400 py-8 text-sm"
                >
                  No activity found for this period.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* View Item Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-3xl w-full max-w-md shadow-xl border border-secondary-100 overflow-hidden"
            >
              <div className="p-5 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">Verification Details</h3>
                <button onClick={() => setSelectedItem(null)} className="p-1.5 hover:bg-secondary-100 rounded-lg text-secondary-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="text-xs text-secondary-400 mb-1">Item Details</div>
                  <div className="font-medium text-secondary-900">{selectedItem.item}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-secondary-400 mb-1">Reported By</div>
                    <div className="font-medium text-secondary-900">#{selectedItem.reporter}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary-400 mb-1">Claimed By</div>
                    <div className="font-medium text-secondary-900">#{selectedItem.claimant}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary-400 mb-1">Time Elapsed</div>
                    <div className="text-sm text-secondary-600">{selectedItem.time}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary-400 mb-1">Risk Level</div>
                    <span className={`badge text-xs ${
                      selectedItem.risk === 'High' ? 'badge-error' :
                      selectedItem.risk === 'Medium' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {selectedItem.risk}
                    </span>
                  </div>
                </div>
                <div className="pt-4 flex gap-2 border-t border-secondary-100">
                  <button onClick={() => { approve(selectedItem.id); setSelectedItem(null); }} className="btn-primary flex-1">Approve</button>
                  <button onClick={() => { reject(selectedItem.id); setSelectedItem(null); }} className="btn-secondary flex-1 text-error hover:bg-error/10 hover:border-error/20">Reject</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
