import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Package, Users, CheckCircle2, TrendingUp, AlertTriangle,
  BarChart2, MapPin, Clock, ChevronRight, Shield, Eye, Trash2
} from 'lucide-react'

const kpisTemplate = [
  { label: 'Active Reports', value: '0', change: 'Updated just now', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Registered Students', value: '0', change: 'Updated just now', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Recovery Rate', value: '78%', change: '↑ 5% this week', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Pending Verification', value: '23', change: '12 urgent', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
]

export default function UniAdminDashboard() {
  const [reports, setReports] = useState([])
  const [students, setStudents] = useState([])
  const [kpis, setKpis] = useState(kpisTemplate)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, [])

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
                    {reports.slice(0, 5).map(r => (
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
                            <button className="p-1.5 rounded-lg hover:bg-primary/10 text-secondary-400 hover:text-primary transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-error/10 text-secondary-400 hover:text-error transition-colors">
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
            {/* Students List */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center justify-between">
                Registered Students
                <span className="text-xs bg-primary-50 text-primary px-2 py-1 rounded-full">{students.length}</span>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <p className="text-sm text-secondary-400 text-center py-4">Loading students...</p>
                ) : students.length > 0 ? (
                  students.map((student, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-medium text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-secondary-900 truncate">{student.name}</div>
                        <div className="text-xs text-secondary-400 truncate">{student.email}</div>
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
    </AppLayout>
  )
}
