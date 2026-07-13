import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Building2, Users, FileText, CheckCircle2,
  MapPin, ChevronRight, Eye, Trash2, Mail, Phone, Shield, X, Edit2
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

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [modalForm, setModalForm] = useState({
    code: '',
    allowed_domain: '',
    allow_personal_emails: false,
    admin_password: ''
  })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Edit University Modal State
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    allowed_domain: '',
    allow_personal_emails: false,
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchData = async () => {
    try {
      const [uniRes, reqRes] = await Promise.all([
        api.get('/admin/universities'),
        api.get('/admin/requests')
      ]);
      
      setUniversities(uniRes.data || []);
      setRequests((reqRes.data || []).filter(r => r.status === 'Pending'));

      setKpis(prev => [
        { ...prev[0], value: uniRes.data.length.toString() },
        prev[1], 
        { ...prev[2], value: reqRes.data.filter(r => r.status === 'Pending').length.toString() },
        prev[3]  
      ]);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [])

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/requests/${id}`, { status: newStatus });
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      // Refresh KPIs
      fetchData();
    } catch (err) {
      console.error('Error updating request status', err);
      alert('Failed to update status');
    }
  }

  const handleDeleteUniversity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this university? This will remove all associated users, items, and claims.')) return;
    try {
      await api.delete(`/admin/universities/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting university', err);
      alert('Failed to delete university');
    }
  }

  const handleEditClick = (uni) => {
    setEditingUniversity(uni)
    setEditForm({
      name: uni.name,
      code: uni.code,
      allowed_domain: uni.allowed_domain,
      allow_personal_emails: uni.allow_personal_emails
    })
    setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')

    try {
      await api.put(`/admin/universities/${editingUniversity.id}`, editForm)
      setEditingUniversity(null)
      fetchData()
    } catch (err) {
      console.error('Error updating university', err)
      setEditError(err.response?.data?.message || 'Failed to update university.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleAcceptClick = (request) => {
    setSelectedRequest(request)
    setModalForm({
      code: '',
      allowed_domain: request.official_email ? request.official_email.split('@')[1] : '',
      allow_personal_emails: false,
      admin_password: ''
    })
    setModalError('')
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')

    try {
      await api.post(`/admin/accept-request/${selectedRequest.id}`, modalForm)
      // Close modal and refresh data
      setSelectedRequest(null)
      fetchData()
    } catch (err) {
      console.error('Error accepting request', err)
      setModalError(err.response?.data?.message || 'Failed to accept request and create university.')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <AppLayout title="Super Admin Dashboard">
      <div className="max-w-7xl mx-auto space-y-6 relative">

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
                              <button onClick={() => handleAcceptClick(r)} className="text-xs px-2 py-1 bg-success/10 text-success rounded-lg hover:bg-success/20">Accept</button>
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
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-secondary-100 hover:border-primary-200 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {uni.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-secondary-900 truncate">{uni.name}</div>
                        <div className="text-xs text-secondary-500 truncate">Domain: {uni.allowed_domain}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditClick(uni)} className="p-1.5 text-secondary-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit University">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUniversity(uni.id)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remove University">
                          <Trash2 className="w-4 h-4" />
                        </button>
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

        {/* Acceptance Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between bg-secondary-50/50">
                <h3 className="font-bold text-secondary-900">Accept University</h3>
                <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-secondary-200 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-secondary-500" />
                </button>
              </div>
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 bg-error/10 text-error text-sm rounded-xl border border-error/20">
                    {modalError}
                  </div>
                )}
                <div className="text-sm text-secondary-600 mb-4">
                  Configuring <span className="font-semibold text-secondary-900">{selectedRequest.university_name}</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">University Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PU"
                    className="input-field w-full"
                    value={modalForm.code}
                    onChange={e => setModalForm({...modalForm, code: e.target.value.toUpperCase()})}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Allowed Domain</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. paruluniversity.ac.in"
                    className="input-field w-full"
                    value={modalForm.allowed_domain}
                    onChange={e => setModalForm({...modalForm, allowed_domain: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Initial Admin Password</label>
                  <input
                    type="text"
                    required
                    placeholder="Set temporary password"
                    className="input-field w-full"
                    value={modalForm.admin_password}
                    onChange={e => setModalForm({...modalForm, admin_password: e.target.value})}
                  />
                  <p className="text-xs text-secondary-400 mt-1">This password will be used by {selectedRequest.contact_person} to log in.</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl border border-secondary-100 mt-2">
                  <div>
                    <div className="text-sm font-semibold text-secondary-900">Allow Personal Emails</div>
                    <div className="text-xs text-secondary-500">Allow students to use gmail.com etc.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={modalForm.allow_personal_emails}
                      onChange={e => setModalForm({...modalForm, allow_personal_emails: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setSelectedRequest(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={modalLoading} className="btn-primary flex-1">
                    {modalLoading ? 'Creating...' : 'Confirm Acceptance'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit University Modal */}
        {editingUniversity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between bg-secondary-50/50">
                <h3 className="font-bold text-secondary-900">Edit University</h3>
                <button onClick={() => setEditingUniversity(null)} className="p-1 hover:bg-secondary-200 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-secondary-500" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-error/10 text-error text-sm rounded-xl border border-error/20">
                    {editError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">University Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parul University"
                    className="input-field w-full"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">University Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PU"
                    className="input-field w-full"
                    value={editForm.code}
                    onChange={e => setEditForm({...editForm, code: e.target.value.toUpperCase()})}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Allowed Domain</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. paruluniversity.ac.in"
                    className="input-field w-full"
                    value={editForm.allowed_domain}
                    onChange={e => setEditForm({...editForm, allowed_domain: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl border border-secondary-100 mt-2">
                  <div>
                    <div className="text-sm font-semibold text-secondary-900">Allow Personal Emails</div>
                    <div className="text-xs text-secondary-500">Allow students to use gmail.com etc.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editForm.allow_personal_emails}
                      onChange={e => setEditForm({...editForm, allow_personal_emails: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingUniversity(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={editLoading} className="btn-primary flex-1">
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
