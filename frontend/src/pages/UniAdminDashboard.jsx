import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Package, Users, CheckCircle2, TrendingUp, AlertTriangle,
  BarChart2, MapPin, Clock, ChevronRight, Shield, Eye, Trash2, Edit2,
  Plus, X, Search, Phone, BookOpen, GraduationCap, FileText, AlertCircle, MessageSquare
} from 'lucide-react'

const kpisTemplate = [
  { label: 'Active Reports', value: '0', change: 'Updated just now', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Registered Students', value: '0', change: 'Updated just now', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Recovery Rate', value: '60%', change: '↑ 5% this week', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Verification Batch', value: '2027', change: 'B.Tech Verified', icon: Shield, color: 'text-warning', bg: 'bg-warning/10' },
]

export default function UniAdminDashboard() {
  const [reports, setReports] = useState([])
  const [students, setStudents] = useState([])
  const [kpis, setKpis] = useState(kpisTemplate)
  const [loading, setLoading] = useState(true)
  const [superAdminError, setSuperAdminError] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [showAllStudents, setShowAllStudents] = useState(false)

  // Selected Student for Security / Fraud Detail Audit Modal
  const [auditStudent, setAuditStudent] = useState(null)

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: 'Foundit@123',
    phone: '',
    department: 'Computer Science & Engineering',
    roll_number: '',
    batch: '2027'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  // Edit Student Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    password: '',
    phone: '',
    department: '',
    roll_number: '',
    batch: ''
  })
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
        prev[3]
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
      setNewStudent({
        name: '',
        email: '',
        password: 'Foundit@123',
        phone: '',
        department: 'Computer Science & Engineering',
        roll_number: '',
        batch: '2027'
      });
      fetchData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudentClick = (student) => {
    setEditingStudent(student);
    setEditStudentForm({
      name: student.name,
      password: '',
      phone: student.phone || '',
      department: student.department || '',
      roll_number: student.roll_number || '',
      batch: student.batch || '2027'
    });
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

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.batch && s.batch.toLowerCase().includes(q))
    );
  });

  const displayedStudents = showAllStudents ? filteredStudents : filteredStudents.slice(0, 10);

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

        {/* Student Verification & Security Audit Directory Section */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Student Security & Verification Directory (B.Tech Batch 2027)
              </h3>
              <p className="text-xs text-secondary-500 mt-1">
                Audit student identity records, verify roll numbers, phone numbers, and investigate security or fraud cases.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, roll no, email, phone..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-xs"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Student
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-secondary-500">Loading student directory...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-100 text-left text-xs font-semibold text-secondary-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Student Name</th>
                    <th className="pb-3">Roll No / ID</th>
                    <th className="pb-3">University Email</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Batch</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3 pr-2 text-right">Security Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 text-sm">
                  {displayedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 pl-2 font-medium text-secondary-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {s.name ? s.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div>{s.name}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-md">
                          {s.roll_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-secondary-600 text-xs">{s.email}</td>
                      <td className="py-3 text-secondary-500 text-xs">{s.department || 'B.Tech CSE'}</td>
                      <td className="py-3 text-secondary-500 text-xs font-semibold">{s.batch || '2027'}</td>
                      <td className="py-3 text-secondary-500 text-xs">{s.phone || 'N/A'}</td>
                      <td className="py-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/chat?peerId=${s.id}&peerName=${encodeURIComponent(s.name)}`)}
                            className="p-1.5 rounded-lg text-secondary-400 hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Message Student"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAuditStudent(s)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Inspect Security Record"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>
                          <button
                            onClick={() => handleEditStudentClick(s)}
                            className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 rounded-lg text-secondary-400 hover:bg-error/10 hover:text-error transition-colors"
                            title="Remove Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayedStudents.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm text-secondary-400">
                        No student records match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            
            {!loading && filteredStudents.length > 10 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowAllStudents(!showAllStudents)}
                  className="text-sm font-medium text-primary hover:text-primary-700 flex items-center gap-2 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors"
                >
                  {showAllStudents ? 'Show Less' : `View All ${filteredStudents.length} Students`}
                </button>
              </div>
            )}
          </div>
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
               <h3 className="font-semibold text-secondary-900 mb-1">Security & Platform Help</h3>
               <p className="text-sm text-secondary-500 mb-4">Escalate fraud cases or system security queries to Super Admin.</p>
               <button onClick={handleMessageSuperAdmin} className="btn bg-primary text-white hover:bg-primary-hover w-full rounded-xl py-2">
                 Message Super Admin
               </button>
               {superAdminError && (
                 <p className="text-xs text-red-500 mt-2 text-center">{superAdminError}</p>
               )}
            </div>

            {/* Quick Audit Tips */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-3 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Fraud Investigation Guide
              </h3>
              <div className="text-xs text-secondary-600 space-y-2 leading-relaxed">
                <p>• Verify student Roll No matches Parul University ERP credentials.</p>
                <p>• Contact the phone number listed on file before approving high-value item handovers.</p>
                <p>• Cross-reference claims against department & graduation batch.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Audit Detail Modal */}
      <AnimatePresence>
        {auditStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-secondary-100"
            >
              <div className="p-6 bg-gradient-to-r from-primary/10 to-violet-600/10 border-b border-secondary-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {auditStudent.name ? auditStudent.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900">{auditStudent.name}</h3>
                    <p className="text-xs text-secondary-500">Student Security Verification Record</p>
                  </div>
                </div>
                <button onClick={() => setAuditStudent(null)} className="text-secondary-400 hover:text-secondary-600 p-1.5 rounded-xl hover:bg-surface transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary-50 p-3 rounded-2xl">
                    <div className="text-xs font-semibold text-secondary-400 uppercase">Roll Number / Student ID</div>
                    <div className="text-sm font-bold font-mono text-secondary-900 mt-1">{auditStudent.roll_number || 'N/A'}</div>
                  </div>
                  <div className="bg-secondary-50 p-3 rounded-2xl">
                    <div className="text-xs font-semibold text-secondary-400 uppercase">Graduation Batch</div>
                    <div className="text-sm font-bold text-secondary-900 mt-1">{auditStudent.batch || '2027'}</div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-secondary-100">
                    <Users className="w-4 h-4 text-secondary-400" />
                    <div>
                      <div className="text-xs text-secondary-400">Full Name</div>
                      <div className="text-sm font-medium text-secondary-900">{auditStudent.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-secondary-100">
                    <Shield className="w-4 h-4 text-secondary-400" />
                    <div>
                      <div className="text-xs text-secondary-400">University Email</div>
                      <div className="text-sm font-medium text-secondary-900">{auditStudent.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-secondary-100">
                    <Phone className="w-4 h-4 text-secondary-400" />
                    <div>
                      <div className="text-xs text-secondary-400">Phone Number</div>
                      <div className="text-sm font-medium text-secondary-900">{auditStudent.phone || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-secondary-100">
                    <BookOpen className="w-4 h-4 text-secondary-400" />
                    <div>
                      <div className="text-xs text-secondary-400">Department / Course</div>
                      <div className="text-sm font-medium text-secondary-900">{auditStudent.department || 'B.Tech CSE'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary-50 border-t border-secondary-100 flex justify-end">
                <button onClick={() => setAuditStudent(null)} className="btn-primary py-2 px-4 text-xs">
                  Done Reviewing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-100">
                <h3 className="text-lg font-bold text-secondary-900">Add B.Tech 2027 Student Record</h3>
                <button onClick={() => setShowAddModal(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-3 overflow-y-auto">
                {addError && (
                  <div className="bg-error/10 text-error text-xs p-3 rounded-lg border border-error/20">
                    {addError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sneh Bharatbhai Patel"
                    className="input-field py-2 text-xs"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">University Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="2303031050445@paruluniversity.ac.in"
                    className="input-field py-2 text-xs"
                    value={newStudent.email}
                    onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-secondary-600 mb-1">Roll No / Student ID</label>
                    <input
                      type="text"
                      placeholder="2303031050445"
                      className="input-field py-2 text-xs"
                      value={newStudent.roll_number}
                      onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary-600 mb-1">Graduation Batch</label>
                    <input
                      type="text"
                      placeholder="2027"
                      className="input-field py-2 text-xs"
                      value={newStudent.batch}
                      onChange={e => setNewStudent({...newStudent, batch: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Computer Science & Engineering"
                    className="input-field py-2 text-xs"
                    value={newStudent.department}
                    onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    className="input-field py-2 text-xs"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input-field py-2 text-xs"
                    value={newStudent.password}
                    onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  />
                  <p className="text-[10px] text-secondary-400 mt-1">Default is Foundit@123. Student can change it anytime.</p>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200 py-2 text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary py-2 text-xs">
                    {isSubmitting ? 'Adding...' : 'Add Student Record'}
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
              className="bg-surface rounded-3xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-100">
                <h3 className="text-lg font-bold text-secondary-900">Edit Student Record</h3>
                <button onClick={() => setShowEditModal(false)} className="text-secondary-400 hover:text-secondary-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-3 overflow-y-auto">
                {editError && (
                  <div className="bg-error/10 text-error text-xs p-3 rounded-lg border border-error/20">
                    {editError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input-field py-2 text-xs"
                    value={editStudentForm.name}
                    onChange={e => setEditStudentForm({...editStudentForm, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-secondary-600 mb-1">Roll No / Student ID</label>
                    <input
                      type="text"
                      className="input-field py-2 text-xs"
                      value={editStudentForm.roll_number}
                      onChange={e => setEditStudentForm({...editStudentForm, roll_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary-600 mb-1">Graduation Batch</label>
                    <input
                      type="text"
                      className="input-field py-2 text-xs"
                      value={editStudentForm.batch}
                      onChange={e => setEditStudentForm({...editStudentForm, batch: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Department</label>
                  <input
                    type="text"
                    className="input-field py-2 text-xs"
                    value={editStudentForm.department}
                    onChange={e => setEditStudentForm({...editStudentForm, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="input-field py-2 text-xs"
                    value={editStudentForm.phone}
                    onChange={e => setEditStudentForm({...editStudentForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary-600 mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    minLength={8}
                    className="input-field py-2 text-xs"
                    placeholder="Leave blank to keep current password"
                    value={editStudentForm.password}
                    onChange={e => setEditStudentForm({...editStudentForm, password: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn bg-secondary-100 text-secondary-700 hover:bg-secondary-200 py-2 text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={isEditing} className="btn-primary py-2 text-xs">
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
