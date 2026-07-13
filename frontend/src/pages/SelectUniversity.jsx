import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ChevronRight, Building2, MapPin, ArrowRight } from 'lucide-react'
import api from '../api'

const colors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-red-500 to-rose-600',
]

export default function SelectUniversity() {
  const [query, setQuery] = useState('')
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await api.get('/auth/universities')
        setUniversities(res.data)
      } catch (err) {
        console.error('Failed to fetch universities', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUniversities()
  }, [])

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-secondary-100 px-6 py-4">
        <div className="section-container flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-lg font-display font-bold text-secondary-900">Found<span className="text-primary">IT</span></span>
          </Link>
          <Link to="/login" className="btn-ghost text-sm">Sign In Instead</Link>
        </div>
      </div>

      <div className="section-container py-16 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-secondary-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-secondary-900 font-medium">Select University</span>
        </nav>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-4">
            Find Your <span className="text-gradient">Campus</span>
          </h1>
          <p className="text-secondary-500 text-lg max-w-xl mx-auto">
            Select your university to access the campus-specific FoundIT ecosystem and see items from your campus.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-10"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by university name..."
            className="input-field input-field-lg pl-14 w-full shadow-md text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 text-xl"
            >
              ×
            </button>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* University Grid */}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {filtered.map((uni, i) => (
              <motion.div
                key={uni.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate('/login', { state: { university: uni } })}
                className="glass-card p-6 cursor-pointer group hover:shadow-xl"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                    {uni.code || uni.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-secondary-900 text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      {uni.name}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-secondary-50 rounded-xl p-2.5 text-center col-span-2">
                    <div className="text-sm font-bold text-secondary-900 truncate">
                      {uni.allowed_domain || 'Any domain'}
                    </div>
                    <div className="text-xs text-secondary-400">Allowed Domain</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="badge-success text-xs">Active on FoundIT</span>
                  <ChevronRight className="w-4 h-4 text-secondary-400 group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No universities found</h3>
            <p className="text-secondary-500 mb-6">Can't find your university? Suggest it for the next expansion.</p>
            <button onClick={() => navigate('/partner')} className="btn-primary">Request My University</button>
          </div>
        )}

        {/* Add University CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/partner')}
          className="border-2 border-dashed border-secondary-200 rounded-3xl p-8 text-center hover:border-primary hover:bg-primary-50/50 transition-all duration-300 cursor-pointer group"
        >
          <Building2 className="w-10 h-10 text-secondary-300 mx-auto mb-3 group-hover:text-primary transition-colors" />
          <h3 className="font-semibold text-secondary-900 mb-1 group-hover:text-primary transition-colors">
            Add Your University
          </h3>
          <p className="text-sm text-secondary-400">
            Is your university not listed? Request a new campus setup.
          </p>
          <button className="btn-primary btn-sm mt-4">
            Request Campus Setup
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
