import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  MapPin, Clock, Tag, Brain, ShieldCheck, MessageSquare,
  ChevronRight, CheckCircle2, Circle, ArrowRight, Share2, Flag, Loader
} from 'lucide-react'


export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setCurrentUser(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/items/${id}`)
        setItem(response.data)
      } catch (error) {
        console.error("Error fetching item:", error)
        // If not found or unauthorized
        if (error.response && (error.response.status === 404 || error.response.status === 403)) {
          navigate('/items')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id, navigate])

  if (loading) {
    return (
      <AppLayout title="Item Details">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!item) return null;

  const createdAt = item.created_at ? new Date(item.created_at) : new Date();
  
  // Create a dynamic timeline based on the item's creation date and status
  const timeline = [
    { label: 'Reported', time: createdAt.toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}), done: true },
    { label: 'Categorized by AI', time: new Date(createdAt.getTime() + 60000).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}), done: true },
    { label: 'Matching Started', time: new Date(createdAt.getTime() + 65000).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}), done: true },
    { label: 'Match Found', time: item.status === 'MATCHED' || item.status === 'RECOVERED' ? 'Yes' : 'In Progress', done: item.status === 'MATCHED' || item.status === 'RECOVERED', highlight: item.status === 'MATCHED' },
    { label: 'Verification Pending', time: item.status === 'VERIFYING' ? 'Awaiting' : '—', done: item.status === 'VERIFYING' || item.status === 'RECOVERED' },
    { label: 'Secure Handover', time: item.status === 'RECOVERED' ? 'Completed' : '—', done: item.status === 'RECOVERED' },
    { label: 'Recovery Completed', time: item.status === 'RECOVERED' ? 'Completed' : '—', done: item.status === 'RECOVERED' },
  ];

  return (
    <AppLayout title="Item Details">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-secondary-400">
          <Link to="/items" className="hover:text-primary transition-colors">Browse Items</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-secondary-900 font-medium">{item.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden"
            >
              <div className="h-64 bg-secondary-50 flex items-center justify-center text-8xl relative overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img src={`http://localhost:5000/uploads/${item.images[0]}`} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  item.category === 'electronics' ? '💻' : item.category === 'documents' ? '📄' : item.category === 'keys' ? '🔑' : '📦'
                )}
                <div className="absolute top-4 left-4">
                  <span className={`badge ${item.type === 'LOST' ? 'badge-error' : 'badge-success'}`}>{item.type}</span>
                </div>
                {item.type === 'LOST' && (
                <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">AI Matching Active</span>
                </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-2xl font-display font-bold text-secondary-900">{item.title}</h1>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl hover:bg-secondary-100 transition-colors text-secondary-500">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-error/10 transition-colors text-secondary-500 hover:text-error">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-secondary-600 leading-relaxed mb-5">{item.description}</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Tag, label: 'Category', value: item.category },
                    { icon: Tag, label: 'Brand', value: item.brand || 'N/A' },
                    { icon: Tag, label: 'Color', value: item.primary_color || 'N/A' },
                    { icon: MapPin, label: 'Last Location', value: item.location },
                    { icon: Clock, label: 'Date', value: item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
                    { icon: Clock, label: 'Time', value: item.time || 'N/A' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 bg-secondary-50 rounded-xl p-3">
                      <Icon className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-secondary-400">{label}</div>
                        <div className="text-sm font-medium text-secondary-900 capitalize">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
              <h3 className="font-semibold text-secondary-900 mb-5">Recovery Timeline</h3>
              <div className="space-y-4">
                {timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {event.done ? (
                        <CheckCircle2 className={`w-5 h-5 ${event.highlight ? 'text-accent' : 'text-primary'}`} />
                      ) : (
                        <Circle className="w-5 h-5 text-secondary-200" />
                      )}
                      {i < timeline.length - 1 && (
                        <div className={`absolute left-2.5 top-5 w-0.5 h-6 ${i < timeline.findIndex(t => !t.done) - 1 ? 'bg-primary/30' : 'bg-secondary-100'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className={`text-sm font-medium ${event.done ? 'text-secondary-900' : 'text-secondary-400'} ${event.highlight ? 'text-accent font-semibold' : ''}`}>
                        {event.label}
                      </div>
                      <div className="text-xs text-secondary-400">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5"
            >
              <h3 className="font-semibold text-secondary-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {currentUser?.id !== item.user_id ? (
                  <>
                    {item.type === 'FOUND' && (
                      <Link to="/verify/1" className="btn-primary w-full justify-center">
                        <ShieldCheck className="w-4 h-4" />
                        Claim This Item
                      </Link>
                    )}
                    <Link to={`/chat?peerId=${item.user_id}&itemId=${item.id}&peerName=${encodeURIComponent(item.profiles?.name || 'User')}&itemTitle=${encodeURIComponent(item.title)}`} className="btn-secondary w-full justify-center">
                      <MessageSquare className="w-4 h-4" />
                      Contact {item.type === 'LOST' ? 'Owner' : 'Finder'}
                    </Link>
                  </>
                ) : (
                  <Link to="/matches" className="btn-primary w-full justify-center">
                    <Brain className="w-4 h-4" />
                    Review AI Matches
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Reporter */}
            <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
              <h3 className="font-semibold text-secondary-900 mb-3 text-sm">Reported By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
                  {item.profiles?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="font-medium text-secondary-900 text-sm">{item.profiles?.name || 'Anonymous Student'}</div>
                  <div className="text-xs text-secondary-400">Verified University Member</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-accent ml-auto" />
              </div>
            </div>

            {/* Similar Matches */}
            {currentUser?.id === item.user_id && item.matches && (
              <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-secondary-900 text-sm">Similar {item.type === 'LOST' ? 'Found' : 'Lost'} Items</h3>
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-3">
                  {item.matches.length > 0 ? item.matches.map((m, i) => {
                    const otherItem = m.lost_item_id === item.id ? m.found_item : m.lost_item;
                    if (!otherItem) return null;
                    const dateStr = new Date(otherItem.date || m.created_at).toLocaleDateString([], {month: 'short', day: 'numeric'});
                    
                    return (
                      <Link key={m.id || i} to={`/matches`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl">
                          {otherItem.category === 'electronics' ? '💻' : otherItem.category === 'documents' ? '📄' : otherItem.category === 'keys' ? '🔑' : '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-secondary-900 truncate">{otherItem.title}</div>
                          <div className="text-xs text-secondary-400">{otherItem.location} · {dateStr}</div>
                        </div>
                        <span className="text-xs font-bold text-primary flex-shrink-0">{m.overall_score}%</span>
                      </Link>
                    )
                  }) : (
                    <p className="text-sm text-secondary-500 text-center py-2">No AI matches found yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
