import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Building2, Users, FileText, CheckCircle2,
  MapPin, ChevronRight, Eye, Trash2, Mail, Phone, Shield
} from 'lucide-react'

const kpisTemplate = [
  { label: 'Partner Universities', value: '0', change: 'Total active', icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Total Users', value: '0', change: 'Across all unis', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Pending Requests', value: '0', change: 'New applications', icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
  { label: 'Total Items', value: '0', change: 'Lost & Found', icon: Shield, color: 'text-accent', bg: 'bg-accent/10' },
]

export default function AdminDashboard() {
  const [universities, setUniversities] = useState([])
  const [requests, setRequests] = useState([])
  const [kpis, setKpis] = useState(kpisTemplate)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uniRes, reqRes] = await Promise.all([
          api.get('/admin/universities'),
          api.get('/admin/requests')
        ]);
        
        setUniversities(uniRes.data || []);
        setRequests(reqRes.data || []);

        setKpis(prev => [
          { ...prev[0], value: uniRes.data.length.toString() },
          prev[1], // Ideally we'd fetch total users across all unis
          { ...prev[2], value: reqRes.data.filter(r => r.status === 'Pending').length.toString() },
          prev[3]  // Ideally we'd fetch total items across all unis
        ]);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [])

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/requests/${id}`, { status: newStatus });
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating request status', err);
      alert('Failed to update status');
    }
  }

  return (
    <AppLayout title="Super Admin Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className="text-xs text-accent font-medium">{kpi.change}</span>
              </div>
              <div className={`text-3xl font-bold ${kpi.color} mb-1`}>
                {kpi.value}
              </div>
              <div className="text-sm text-secondary-500">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Requests Table */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Partner University Requests</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-secondary-500">Loading requests...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {['University', 'Contact Person', 'Email', 'Status', 'Actions'].map(h => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="table-cell font-medium">{r.university_name}</td>
                        <td className="table-cell">{r.contact_person}</td>
                        <td className="table-cell text-secondary-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {r.official_email}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${r.status === 'Pending' ? 'badge-warning' : r.status === 'Accept' ? 'badge-success' : 'badge-secondary'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          {r.status === 'Pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleUpdateStatus(r.id, 'Accept')} className="text-xs px-2 py-1 bg-success/10 text-success rounded-lg hover:bg-success/20">Accept</button>
                              <button onClick={() => handleUpdateStatus(r.id, 'Reject')} className="text-xs px-2 py-1 bg-error/10 text-error rounded-lg hover:bg-error/20">Reject</button>
                            </div>
                          )}
                          {r.status !== 'Pending' && (
                            <span className="text-xs text-secondary-400">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-sm text-secondary-500">No requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            {/* Active Universities */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center justify-between">
                Active Universities
                <span className="text-xs bg-primary-50 text-primary px-2 py-1 rounded-full">{universities.length}</span>
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <p className="text-sm text-secondary-400 text-center py-4">Loading universities...</p>
                ) : universities.length > 0 ? (
                  universities.map((uni, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-secondary-100 hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {uni.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-secondary-900 truncate">{uni.name}</div>
                        <div className="text-xs text-secondary-500 truncate">Domain: {uni.allowed_domain}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary-400 text-center py-4">No universities found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
