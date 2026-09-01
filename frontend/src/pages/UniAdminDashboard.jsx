import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Package, Users, CheckCircle2, TrendingUp, AlertTriangle,
  BarChart2, MapPin, Clock, ChevronRight, Shield, Eye, Trash2, Edit2,
  Plus, X
} from 'lucide-react'

const kpisTemplate = [
  { label: 'Active Reports', value: '0', change: 'Updated just now', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Registered Students', value: '5', change: 'Updated just now', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Recovery Rate', value: '60%', change: '↑ 5% this week', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Pending Verification', value: '3', change: '2 urgent', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
]

export default function UniAdminDashboard() {
  const [reports, setReports] = useState([])
  const [students, setStudents] = useState([])
  const [kpis, setKpis] = useState(kpisTemplate)
  const [loading, setLoading] = useState(true)
  const [superAdminError, setSuperAdminError] = useState('')
  
  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit Student Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editStudentForm, setEditStudentForm] = useState({ name: '', password: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')

  const navigate = useNavigate()
  
  const handleMessageSuperAdmin = async () => {
    try {
      const res = await api.get('/support/superadmin')
      const { adminId, adminName } = res.data
      navigate(`/chat?peerId=${adminId}&peerName=${encodeURIComponent(adminName)}&itemId=11111111-1111-1111-1111-111111111111&itemTitle=Support+Session`)
    } catch (err) {
      setSuperAdminError('No Super Admin account found. Please ensure a super_admin user exists in the system.')
    }
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, itemsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/items')
      ]);
      
      const studentsData = studentsRes.data || [];
      const itemsData = itemsRes.data || [];

      setStudents(studentsData);
      
      const mappedItems = itemsData.map(item => ({
        id: item.id,
        user: item.profiles ? item.profiles.name : 'Unknown',
        item: item.title,
        category: item.category,
        location: item.location,
        time: new Date(item.created_at).toLocaleDateString(),
        status: item.status,
        statusColor: item.status === 'Available' || item.status === 'Resolved' ? 'badge-success' : 'badge-warning'
      }));
      
      setReports(mappedItems);

      setKpis(prev => [
        { ...prev[0], value: mappedItems.length.toString() },
        { ...prev[1], value: studentsData.length.toString() },
        prev[2],
        { ...prev[3], value: '3' }
      ]);
    } catch (err) {
      console.error('Error fetching uni admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [])

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddError('');
    setIsSubmitting(true);
    try {
      await api.post('/admin/students', newStudent);
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', password: '' });
      fetchData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudentClick = (student) => {
    setEditingStudent(student);
    setEditStudentForm({ name: student.name, password: '' });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsEditing(true);
    try {
      await api.put(`/admin/students/${editingStudent.id}`, editStudentForm);
      setShowEditModal(false);
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the student account for ${name}?`)) return;
    
    try {
      await api.delete(`/admin/students/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete the report for "${title}"?`)) return;
    
    try {
      await api.delete(`/admin/items/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  return (
    <AppLayout title="University Admin Dashboard">
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
          {/* Reports Table */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Recent Campus Reports</h3>
              <Link to="/items" className="text-sm text-primary hover:text-primary-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-secondary-500">Loading reports...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Reporter', 'Item', 'Category', 'Location', 'Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="table-cell font-medium">{r.user}</td>
                        <td className="table-cell">{r.item}</td>
                        <td className="table-cell text-secondary-400">{r.category}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-secondary-400" />
                            {r.location}
                          </div>
                        </td>
                        <td className="table-cell text-secondary-400 text-xs">{r.time}</td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${r.statusColor}`}>{r.status}</span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <Link to={`/items/${r.id}`} className="p-1.5 rounded-lg hover:bg-primary/10 text-secondary-400 hover:text-primary transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={() => handleDeleteItem(r.id, r.item)} className="p-1.5 rounded-lg hover:bg-error/10 text-secondary-400 hover:text-error transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-sm text-secondary-500">No recent reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sidebar widgets */}
          <div className="space-y-4">
            
            {/* Super Admin Contact */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5 flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                 <Shield className="w-6 h-6 text-primary" />
               </div>
               <h3 className="font-semibold text-secondary-900 mb-1">Need Platform Help?</h3>
               <p className="text-sm text-secondary-500 mb-4">Contact the Super Admin for platform-wide issues.</p>
               <button onClick={handleMessageSuperAdmin} className="btn bg-primary text-white hover:bg-primary-hover w-full rounded-xl py-2">
                 Message Super Admin
               </button>
               {superAdminError && (
                 <p className="text-xs text-red-500 mt-2 text-center">{superAdminError}</p>
               )}
            </div>

            {/* Students List */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900 flex items-center">
                  Registered Students
                  <span className="ml-2 text-xs bg-primary-50 text-primary px-2 py-1 rounded-full">{students.length}</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-xs flex items-center gap-1 text-primary hover:text-primary-700 bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <p className="text-sm text-secondary-400 text-center py-4">Loading students...</p>
                ) : students.length > 0 ? (
                  students.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-medium text-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-secondary-900 truncate">{student.name}</div>
                          <div className="text-xs text-secondary-400 truncate">{student.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEditStudentClick(student)}
                          className="p-1.5 rounded-lg text-secondary-400 hover:bg-primary/10 hover:text-primary transition-all"
                          title="Edit student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="p-1.5 rounded-lg text-secondary-400 hover:bg-error/10 hover:text-error transition-all"
                          title="Remove student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary-400 text-center py-4">No students registered yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-100">
                <h3 className="text-lg font-bold text-secondary-900">Add New Student</h3>
                <button onClick={() => setShowAddModal(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                {addError && (
                  <div className="bg-error/10 text-error text-sm p-3 rounded-lg border border-error/20">
                    {addError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={newStudent.email}
                    onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input-field"
                    value={newStudent.password}
                    onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-100">
                <h3 className="text-lg font-bold text-secondary-900">Edit Student</h3>
                <button onClick={() => setShowEditModal(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-4">
                {editError && (
                  <div className="bg-error/10 text-error text-sm p-3 rounded-lg border border-error/20">
                    {editError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editStudentForm.name}
                    onChange={e => setEditStudentForm({...editStudentForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">New Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    minLength={8}
                    className="input-field"
                    placeholder="Enter new password"
                    value={editStudentForm.password}
                    onChange={e => setEditStudentForm({...editStudentForm, password: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={isEditing} className="btn-primary">
                    {isEditing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  )
}
