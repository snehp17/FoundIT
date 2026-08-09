import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Building2, Users, FileText, CheckCircle2,
  MapPin, ChevronRight, Eye, Trash2, Mail, Phone, Shield, X, Edit2,
  BookOpen, Briefcase, Plus, ToggleLeft, ToggleRight, ChevronDown,
  Send, Clock, UserCheck, UserX, ExternalLink, AlignLeft, MessageSquare
} from 'lucide-react'

const kpisTemplate = [
  { label: 'Partner Universities', value: '0', change: 'Total active', icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Total Users', value: '0', change: 'Across all unis', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Pending Requests', value: '0', change: 'New applications', icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
  { label: 'Total Items', value: '0', change: 'Lost & Found', icon: Shield, color: 'text-accent', bg: 'bg-accent/10' },
]

const ADMIN_TABS = [
  { id: 'universities', label: 'Universities', icon: Building2 },
  { id: 'blog', label: 'Blog Posts', icon: BookOpen },
  { id: 'jobs', label: 'Jobs & Applications', icon: Briefcase },
]

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  cls: 'bg-warning/10 text-amber-700' },
  reviewed: { label: 'Reviewed', cls: 'bg-blue-100 text-blue-700' },
  selected: { label: 'Selected', cls: 'bg-accent/10 text-accent' },
  rejected: { label: 'Rejected', cls: 'bg-error/10 text-error' },
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('universities')
  const [universities, setUniversities] = useState([])
  const [requests, setRequests] = useState([])
  const [kpis, setKpis] = useState(kpisTemplate)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Blog state
  const [blogPosts, setBlogPosts] = useState([])
  const [blogLoading, setBlogLoading] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [blogForm, setBlogForm] = useState({ tag: 'FoundIT News', tag_color: 'badge-primary', title: '', description: '', content: '', author: 'FoundIT Team', published: true })
  const [blogSaving, setBlogSaving] = useState(false)

  // Jobs / Applications state
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJobFilter, setSelectedJobFilter] = useState('all')
  const [viewingApplication, setViewingApplication] = useState(null)
  const [appStatusUpdating, setAppStatusUpdating] = useState(null)

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

  const fetchBlog = async () => {
    setBlogLoading(true)
    try {
      const r = await api.get('/content/admin/blog')
      setBlogPosts(r.data)
    } catch (e) { console.error(e) }
    finally { setBlogLoading(false) }
  }

  const fetchJobsAndApplications = async () => {
    setJobsLoading(true)
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/content/admin/jobs'),
        api.get('/content/admin/applications')
      ])
      setJobs(jobsRes.data)
      setApplications(appsRes.data)
    } catch (e) { console.error(e) }
    finally { setJobsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (activeTab === 'blog') fetchBlog() }, [activeTab])
  useEffect(() => { if (activeTab === 'jobs') fetchJobsAndApplications() }, [activeTab])

  // Blog handlers
  const openBlogCreate = () => {
    setEditingPost(null)
    setBlogForm({ tag: 'FoundIT News', tag_color: 'badge-primary', title: '', description: '', content: '', author: 'FoundIT Team', published: true })
    setShowBlogForm(true)
  }
  const openBlogEdit = (post) => {
    setEditingPost(post)
    setBlogForm({ tag: post.tag, tag_color: post.tag_color, title: post.title, description: post.description, content: post.content, author: post.author, published: post.published })
    setShowBlogForm(true)
  }
  const handleBlogSave = async (e) => {
    e.preventDefault()
    setBlogSaving(true)
    try {
      if (editingPost) await api.put(`/content/admin/blog/${editingPost.id}`, blogForm)
      else await api.post('/content/admin/blog', blogForm)
      setShowBlogForm(false)
      fetchBlog()
    } catch (err) { alert(err.response?.data?.message || 'Failed to save post') }
    finally { setBlogSaving(false) }
  }
  const handleBlogDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return
    await api.delete(`/content/admin/blog/${id}`)
    fetchBlog()
  }
  const handleBlogToggle = async (post) => {
    await api.put(`/content/admin/blog/${post.id}`, { published: !post.published })
    fetchBlog()
  }

  // Application handlers
  const handleAppStatus = async (appId, status) => {
    setAppStatusUpdating(appId)
    try {
      await api.put(`/content/admin/applications/${appId}`, { status })
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      if (viewingApplication?.id === appId) setViewingApplication(prev => ({ ...prev, status }))
    } catch (e) { alert('Failed to update status') }
    finally { setAppStatusUpdating(null) }
  }

  const filteredApplications = selectedJobFilter === 'all'
    ? applications
    : applications.filter(a => a.job_id === selectedJobFilter)

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

  const handleMessageUniAdmin = async (uni) => {
    try {
      const res = await api.get(`/support/university-admin/${uni.id}`)
      const { adminId, adminName } = res.data
      navigate(`/chat?peerId=${adminId}&peerName=${encodeURIComponent(adminName)}&itemId=11111111-1111-1111-1111-111111111111&itemTitle=Support+Session`)
    } catch (err) {
      alert("Could not find a registered admin for this university yet.")
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
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className="text-xs text-accent font-medium">{kpi.change}</span>
              </div>
              <div className={`text-3xl font-bold ${kpi.color} mb-1`}>{kpi.value}</div>
              <div className="text-sm text-secondary-500">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-secondary-50 rounded-2xl p-1.5 border border-secondary-100 w-fit">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm border border-secondary-200'
                  : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── UNIVERSITIES TAB ── */}
        {activeTab === 'universities' && (
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
                        <button onClick={() => handleMessageUniAdmin(uni)} className="p-1.5 text-secondary-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Message Admin">
                          <MessageSquare className="w-4 h-4" />
                        </button>
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
        )}

        {/* ── BLOG TAB ── */}
        {activeTab === 'blog' && (
          <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Blog Posts</h3>
              <button onClick={openBlogCreate} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> New Post</button>
            </div>
            {blogLoading ? (
              <div className="p-8 text-center text-secondary-400 animate-pulse">Loading posts...</div>
            ) : (
              <table className="w-full">
                <thead><tr>{['Title', 'Tag', 'Author', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody>
                  {blogPosts.map(post => (
                    <tr key={post.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="table-cell max-w-xs">
                        <div className="font-medium text-secondary-900 truncate">{post.title}</div>
                        <div className="text-xs text-secondary-400 truncate">{post.description}</div>
                      </td>
                      <td className="table-cell"><span className={`badge text-xs ${post.tag_color}`}>{post.tag}</span></td>
                      <td className="table-cell text-sm text-secondary-500">{post.author}</td>
                      <td className="table-cell text-sm text-secondary-400">{new Date(post.published_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <button onClick={() => handleBlogToggle(post)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                          post.published ? 'bg-accent/10 text-accent' : 'bg-secondary-100 text-secondary-500'
                        }`}>
                          {post.published ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {post.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Link to={`/blog/${post.id}`} target="_blank" className="p-1.5 text-secondary-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View"><ExternalLink className="w-4 h-4" /></Link>
                          <button onClick={() => openBlogEdit(post)} className="p-1.5 text-secondary-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleBlogDelete(post.id)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {blogPosts.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-secondary-400 text-sm">No blog posts yet. Click "New Post" to create one.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── JOBS & APPLICATIONS TAB ── */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Job Listings Overview */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-100">
                <h3 className="font-semibold text-secondary-900 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Active Job Listings</h3>
              </div>
              {jobsLoading ? (
                <div className="p-8 text-center text-secondary-400 animate-pulse">Loading...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4 p-6">
                  {jobs.map(job => {
                    const jobApps = applications.filter(a => a.job_id === job.id)
                    const pending = jobApps.filter(a => a.status === 'pending').length
                    return (
                      <div key={job.id} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedJobFilter === job.id ? 'border-primary bg-primary/5' : 'border-secondary-100 hover:border-primary/30'
                      }`} onClick={() => setSelectedJobFilter(selectedJobFilter === job.id ? 'all' : job.id)}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="badge text-xs bg-primary/10 text-primary">{job.type}</span>
                          {pending > 0 && <span className="text-xs font-bold bg-warning/10 text-warning px-2 py-0.5 rounded-full">{pending} new</span>}
                        </div>
                        <h4 className="font-bold text-secondary-900 text-sm mb-1">{job.role}</h4>
                        <p className="text-xs text-secondary-400">{job.location}</p>
                        <p className="text-xs text-secondary-500 mt-2">{jobApps.length} application{jobApps.length !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  })}
                  {jobs.length === 0 && <p className="text-secondary-400 text-sm col-span-3 text-center py-4">No job listings found.</p>}
                </div>
              )}
            </div>

            {/* Applications Table */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">
                  Applications
                  {selectedJobFilter !== 'all' && (
                    <span className="ml-2 text-xs text-secondary-400">— {jobs.find(j => j.id === selectedJobFilter)?.role}</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary-400">{filteredApplications.length} total</span>
                  {selectedJobFilter !== 'all' && (
                    <button onClick={() => setSelectedJobFilter('all')} className="text-xs text-primary hover:underline">Show all</button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>{['Applicant', 'Position', 'Applied', 'Status', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredApplications.map(app => (
                      <tr key={app.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="table-cell">
                          <div className="font-medium text-secondary-900">{app.name}</div>
                          <div className="text-xs text-secondary-400 flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</div>
                          {app.phone && <div className="text-xs text-secondary-400 flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</div>}
                        </td>
                        <td className="table-cell text-sm text-secondary-600">{app.job_listings?.role || '—'}</td>
                        <td className="table-cell text-xs text-secondary-400">{new Date(app.applied_at).toLocaleDateString()}</td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${STATUS_CONFIG[app.status]?.cls}`}>
                            {STATUS_CONFIG[app.status]?.label || app.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewingApplication(app)} className="p-1.5 text-secondary-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Cover Letter">
                              <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                              disabled={appStatusUpdating === app.id}
                              onClick={() => handleAppStatus(app.id, 'reviewed')}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Mark Reviewed"
                            ><Eye className="w-4 h-4" /></button>
                            <button
                              disabled={appStatusUpdating === app.id}
                              onClick={() => handleAppStatus(app.id, 'selected')}
                              className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Select Candidate"
                            ><UserCheck className="w-4 h-4" /></button>
                            <button
                              disabled={appStatusUpdating === app.id}
                              onClick={() => handleAppStatus(app.id, 'rejected')}
                              className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Reject"
                            ><UserX className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredApplications.length === 0 && (
                      <tr><td colSpan="5" className="p-8 text-center text-sm text-secondary-400">No applications yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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

        {/* Blog Post Modal */}
        {showBlogForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md rounded-t-3xl z-10">
                <h3 className="font-bold text-secondary-900">{editingPost ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                <button onClick={() => setShowBlogForm(false)} className="p-1 hover:bg-secondary-200 rounded-lg"><X className="w-5 h-5 text-secondary-500" /></button>
              </div>
              <form onSubmit={handleBlogSave} className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Title *</label>
                    <input type="text" required className="input-field w-full" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Author</label>
                    <input type="text" className="input-field w-full" value={blogForm.author} onChange={e => setBlogForm({...blogForm, author: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Tag</label>
                    <input type="text" className="input-field w-full" value={blogForm.tag} onChange={e => setBlogForm({...blogForm, tag: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Tag Color</label>
                    <select className="input-field w-full" value={blogForm.tag_color} onChange={e => setBlogForm({...blogForm, tag_color: e.target.value})}>
                      <option value="badge-primary">Primary (Purple)</option>
                      <option value="badge-success">Success (Green)</option>
                      <option value="badge-warning">Warning (Orange)</option>
                      <option value="badge-error">Error (Red)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Short Description *</label>
                  <textarea rows="2" required className="input-field w-full" value={blogForm.description} onChange={e => setBlogForm({...blogForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1 block">Markdown Content *</label>
                  <textarea rows="10" required className="input-field w-full font-mono text-sm" value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} />
                </div>
                <div className="flex gap-3 pt-4 border-t border-secondary-100">
                  <button type="button" onClick={() => setShowBlogForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={blogSaving} className="btn-primary flex-1">{blogSaving ? 'Saving...' : 'Save Post'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Application Modal */}
        {viewingApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8">
              <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md rounded-t-3xl z-10">
                <div>
                  <h3 className="font-bold text-secondary-900">Application Review</h3>
                  <p className="text-xs text-secondary-500">{viewingApplication.job_listings?.role}</p>
                </div>
                <button onClick={() => setViewingApplication(null)} className="p-1 hover:bg-secondary-200 rounded-lg"><X className="w-5 h-5 text-secondary-500" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 bg-secondary-50 p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {viewingApplication.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary-900">{viewingApplication.name}</h4>
                    <div className="flex gap-4 text-sm text-secondary-500 mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {viewingApplication.email}</span>
                      {viewingApplication.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {viewingApplication.phone}</span>}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2 text-sm uppercase tracking-wider">Cover Letter</h4>
                  <div className="bg-surface border border-secondary-200 rounded-xl p-4 whitespace-pre-wrap text-sm text-secondary-700 leading-relaxed">
                    {viewingApplication.cover_letter}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-secondary-100">
                  <button onClick={() => handleAppStatus(viewingApplication.id, 'rejected')} className="btn-secondary !text-error !border-error hover:!bg-error/10">Reject</button>
                  <button onClick={() => handleAppStatus(viewingApplication.id, 'selected')} className="btn-primary !bg-accent hover:!bg-accent/90">Select Candidate</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
