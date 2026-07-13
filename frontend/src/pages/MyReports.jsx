import { useState, useEffect } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import {
  Search, Filter, SlidersHorizontal, MapPin, Clock, ChevronDown,
  X, Grid, List, Brain, CheckCircle2, AlertCircle, Package
} from 'lucide-react'

// (items will be fetched from API instead)

const statusColors = {
  'AI Matching': 'badge-warning',
  'Match Found!': 'badge-success',
  'Available': 'badge-primary',
  'Claimed': 'badge-secondary',
  'Active': 'badge-secondary',
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-3xl border border-secondary-100 p-5 space-y-3">
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
      <div className="skeleton h-3 w-2/3 rounded-lg" />
    </div>
  )
}

function ItemCard({ item, view }) {
  const isLost = item.type === 'LOST'

  if (view === 'list') {
    return (
      <Link to={`/items/${item.id}`}>
        <motion.div
          whileHover={{ x: 2 }}
          className="bg-surface rounded-2xl border border-secondary-100 shadow-md hover:shadow-xl hover:border-primary/20 transition-all duration-200 flex items-center gap-4 p-4"
        >
          {/* Photo placeholder */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${isLost ? 'bg-error/10' : 'bg-accent/10'}`}>
            {isLost ? '📱' : '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-secondary-900 text-sm truncate">{item.title}</h3>
              <span className={`badge text-xs flex-shrink-0 ${isLost ? 'badge-error' : 'badge-success'}`}>{item.type}</span>
            </div>
            <p className="text-xs text-secondary-400 truncate">{item.desc}</p>
            <div className="flex items-center gap-3 text-xs text-secondary-400 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{item.location}</span>
              <Clock className="w-3 h-3" />
              <span>{item.time}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {item.match && <span className="text-sm font-bold text-primary">{item.match} match</span>}
            <span className={`badge text-xs ${statusColors[item.status]}`}>{item.status}</span>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <Link to={`/items/${item.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-surface rounded-3xl border border-secondary-100 shadow-md hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden"
      >
        {/* Image */}
        <div className={`h-44 flex items-center justify-center text-5xl relative ${isLost ? 'bg-error/5' : 'bg-accent/5'}`}>
          {isLost ? '📱' : '📦'}
          <div className="absolute top-3 left-3">
            <span className={`badge text-xs ${isLost ? 'badge-error' : 'badge-success'}`}>{item.type}</span>
          </div>
          {item.match && (
            <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur rounded-xl px-2 py-1 flex items-center gap-1">
              <Brain className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">{item.match}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-secondary-900 mb-1 truncate">{item.title}</h3>
          <p className="text-xs text-secondary-400 mb-3 line-clamp-2">{item.desc}</p>
          <div className="flex items-center gap-1 text-xs text-secondary-400 mb-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-secondary-400 mb-3">
            <Clock className="w-3 h-3" />
            <span>{item.time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="badge-secondary text-xs">{item.category}</span>
            <span className={`badge text-xs ${statusColors[item.status]}`}>{item.status}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function MyReports() {
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('lost')
  const [view, setView] = useState('grid')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/items')
        const user = JSON.parse(localStorage.getItem('user'))
        const myItems = res.data.filter(item => item.user_id === user?.id)
        // Data format mapping:
        const formattedItems = myItems.map(dbItem => ({
          id: dbItem.id,
          type: dbItem.type.toUpperCase(),
          title: dbItem.title,
          category: dbItem.category,
          location: dbItem.location,
          time: new Date(dbItem.created_at).toLocaleDateString(),
          date: new Date(dbItem.date).toLocaleDateString(),
          status: dbItem.status,
          match: null,
          img: dbItem.images?.[0] || null,
          desc: dbItem.description
        }))
        setItems(formattedItems)
      } catch (err) {
        console.error('Error fetching items', err)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const filtered = items.filter(item => {
    if (tab === 'lost' && item.type !== 'LOST') return false
    if (tab === 'found' && item.type !== 'FOUND') return false
    if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <AppLayout title="My Reports">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search items, category, location..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-11 w-full"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 flex-shrink-0 ${showFilters ? 'border-primary text-primary' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex border border-secondary-200 rounded-xl overflow-hidden flex-shrink-0">
            <button onClick={() => setView('grid')} className={`px-3 py-2 transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-secondary-500 hover:bg-secondary-50'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-secondary-500 hover:bg-secondary-50'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-surface rounded-2xl border border-secondary-100 shadow-md p-5 grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2 block">Category</label>
                  <select className="input-field text-sm py-2">
                    <option>All Categories</option>
                    <option>Electronics</option>
                    <option>Documents</option>
                    <option>Accessories</option>
                    <option>Bags</option>
                    <option>Books</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2 block">Location</label>
                  <select className="input-field text-sm py-2">
                    <option>All Locations</option>
                    <option>Main Library</option>
                    <option>Cafeteria</option>
                    <option>Sports Complex</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2 block">Date Range</label>
                  <select className="input-field text-sm py-2">
                    <option>Any Time</option>
                    <option>Today</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs + Count */}
        <div className="flex items-center justify-between">
          <div className="flex bg-secondary-100 rounded-xl p-1 gap-0.5">
            {[
              { key: 'lost', label: 'Lost Items', count: items.filter(i => i.type === 'LOST').length },
              { key: 'found', label: 'Found Items', count: items.filter(i => i.type === 'FOUND').length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.key ? 'bg-surface text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
                }`}
              >
                {t.label}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tab === t.key ? 'bg-primary text-white' : 'bg-secondary-200 text-secondary-500'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm text-secondary-400">{filtered.length} results</p>
        </div>

        {/* Items Grid / List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-surface rounded-3xl border border-secondary-100">
            <Package className="w-16 h-16 text-secondary-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No items found</h3>
            <p className="text-secondary-500 mb-6">Try adjusting your search or filters.</p>
            <button onClick={() => { setQuery(''); setTab('all') }} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <motion.div
            layout
            className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-4 gap-5' : 'space-y-3'}
          >
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <ItemCard item={item} view={view} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
