import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import {
  Package, Clock, TrendingUp, Brain, Plus, Search,
  ArrowRight, CheckCircle2, AlertCircle, Eye, MapPin,
  Bell, BarChart2, ChevronRight
} from 'lucide-react'

const recentItems = [
  { id: 1, type: 'LOST', title: 'MacBook Pro 14"', category: 'Electronics', location: 'Main Library', time: '2h ago', status: 'Matching', statusColor: 'badge-warning', match: '87%' },
  { id: 2, type: 'FOUND', title: 'Blue Hydroflask', category: 'Personal Items', location: 'Cafeteria', time: '4h ago', status: 'Pending Claim', statusColor: 'badge-primary', match: null },
  { id: 3, type: 'LOST', title: 'Student ID Card', category: 'Documents', location: 'Bus Stop', time: '1d ago', status: 'Match Found!', statusColor: 'badge-success', match: '94%' },
  { id: 4, type: 'FOUND', title: 'AirPods Pro (Left)', category: 'Electronics', location: 'Lecture Hall B', time: '6h ago', status: 'Verified', statusColor: 'badge-success', match: null },
  { id: 5, type: 'LOST', title: 'Prescription Glasses', category: 'Accessories', location: 'Sports Complex', time: '2d ago', status: 'Active', statusColor: 'badge-secondary', match: '62%' },
]

const notifications = [
  { icon: Brain, text: '94% match found for your Student ID Card report', time: '5m ago', type: 'match', color: 'text-primary bg-primary/10' },
  { icon: CheckCircle2, text: 'Your MacBook Pro claim has been verified', time: '1h ago', type: 'verify', color: 'text-accent bg-accent/10' },
  { icon: Bell, text: 'New item found in Main Library – Laptop Bag', time: '3h ago', type: 'alert', color: 'text-warning bg-warning/10' },
]

export default function Dashboard() {
  const stats = [
    { icon: Package, label: 'Active Reports', value: '3', change: '+1 today', color: 'text-primary', bg: 'bg-primary/10', trend: 'up' },
    { icon: Brain, label: 'AI Matches', value: '2', change: '87% avg confidence', color: 'text-purple-600', bg: 'bg-purple-100', trend: 'up' },
    { icon: Clock, label: 'Pending Claims', value: '1', change: 'Awaiting verification', color: 'text-warning', bg: 'bg-warning/10', trend: 'neutral' },
    { icon: CheckCircle2, label: 'Items Recovered', value: '4', change: 'Total lifetime', color: 'text-accent', bg: 'bg-accent/10', trend: 'up' },
  ]

  return (
    <AppLayout title="Campus Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-secondary-900 rounded-3xl p-6 md:p-8 overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 left-1/2 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-1">
                Good morning, Student! 👋
              </h2>
              <p className="text-secondary-400">
                IIT Delhi Campus · 2 items awaiting your action
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/report-lost" className="btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                Report Lost
              </Link>
              <Link to="/report-found" className="btn-sm inline-flex items-center gap-2 bg-surface/10 text-white border border-white/20 rounded-xl px-4 py-2 hover:bg-surface/20 transition-all">
                <Plus className="w-4 h-4" />
                Report Found
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm font-medium text-secondary-900">{stat.label}</div>
              <div className="text-xs text-secondary-400 mt-0.5">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Items */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">Recent Reports</h3>
                <Link to="/items" className="text-sm text-primary hover:text-primary-700 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-secondary-100">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.type === 'LOST' ? 'bg-error/10 text-error' : 'bg-accent/10 text-green-700'}`}>
                      {item.type === 'LOST' ? '✕' : '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-secondary-900 text-sm">{item.title}</span>
                        <span className={`badge text-xs ${item.type === 'LOST' ? 'badge-error' : 'badge-success'}`}>{item.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-secondary-400 mt-0.5">
                        <span>{item.category}</span>
                        <span>·</span>
                        <MapPin className="w-3 h-3" />
                        <span>{item.location}</span>
                        <span>·</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.match && (
                        <span className="text-xs font-bold text-primary">{item.match}</span>
                      )}
                      <span className={`badge text-xs ${item.statusColor}`}>{item.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            {/* Notifications */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900 text-sm">Recent Alerts</h3>
                <Link to="/notifications" className="text-xs text-primary">See all</Link>
              </div>
              <div className="divide-y divide-secondary-100">
                {notifications.map((notif, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                      <notif.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-secondary-700 leading-relaxed">{notif.text}</p>
                      <span className="text-xs text-secondary-400">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Package, label: 'Report Lost', path: '/report-lost', color: 'hover:bg-error/5 hover:border-error/20 hover:text-error' },
                  { icon: Search, label: 'Browse Found', path: '/items?type=found', color: 'hover:bg-accent/5 hover:border-accent/20 hover:text-green-700' },
                  { icon: Brain, label: 'View Matches', path: '/matches', color: 'hover:bg-primary/5 hover:border-primary/20 hover:text-primary' },
                  { icon: BarChart2, label: 'Analytics', path: '/analytics', color: 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-secondary-100 text-secondary-600 transition-all duration-200 ${action.color} cursor-pointer`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recovery rate */}
            <div className="bg-primary/5 rounded-3xl border border-primary/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Campus Recovery Rate</span>
              </div>
              <div className="text-4xl font-bold text-secondary-900 mb-1">78%</div>
              <div className="text-xs text-secondary-400 mb-3">↑ 5% from last month</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
