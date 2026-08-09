import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Sparkles, CheckCircle2, XCircle, MessageSquare, ChevronRight,
  MapPin, Calendar, Tag, Zap, AlertCircle, RefreshCw, Shield,
  TrendingUp, Image, FileText, Clock
} from 'lucide-react'

const statusColors = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-error',
  expired: 'text-secondary-400 bg-secondary-100'
}

const statusLabels = {
  pending: 'Awaiting Review',
  accepted: 'Match Accepted',
  rejected: 'Rejected',
  expired: 'Expired'
}

function ScoreBar({ label, value, icon: Icon }) {
  if (value === null || value === undefined) return null
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-secondary-500">
          <Icon className="w-3 h-3" />{label}
        </div>
        <span className="font-semibold text-secondary-700">{value}%</span>
      </div>
      <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${value >= 70 ? 'bg-accent' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function MatchCard({ match, onAccept, onReject, onViewTracking }) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState(false)

  const isOwner = match.userRole === 'owner'
  const isPending = match.status === 'pending'
  const score = match.overall_score ?? 0
  const scoreColor = score >= 70 ? 'text-accent' : score >= 45 ? 'text-amber-500' : 'text-red-500'

  const lostImg = match.lost_item?.images?.[0]
  const foundImg = match.found_item?.images?.[0]
  const imgBase = 'http://localhost:5000/uploads/'

  const handleAccept = async () => {
    setActing(true)
    await onAccept(match.id)
    setActing(false)
  }

  const handleReject = async () => {
    setActing(true)
    await onReject(match.id)
    setActing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${score >= 70 ? 'bg-accent/10' : score >= 45 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <span className={scoreColor}>{Math.round(score)}</span>
            </div>
            <div>
              <p className="text-xs text-secondary-400 font-medium">AI Match Score</p>
              <div className="flex items-center gap-1">
                <Sparkles className={`w-3 h-3 ${scoreColor}`} />
                <span className={`text-sm font-bold ${scoreColor}`}>
                  {score >= 70 ? 'High Confidence' : score >= 45 ? 'Possible Match' : 'Low Match'}
                </span>
              </div>
            </div>
          </div>
          <span className={`badge text-xs ${statusColors[match.status]}`}>
            {statusLabels[match.status]}
          </span>
        </div>

        {/* Items comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Lost Item */}
          <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
            <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> LOST
            </p>
            {lostImg && (
              <img src={`${imgBase}${lostImg}`} alt="" className="w-full h-20 object-cover rounded-xl mb-2" />
            )}
            <p className="font-semibold text-secondary-800 text-sm truncate">{match.lost_item?.title || '—'}</p>
            <p className="text-xs text-secondary-500 flex items-center gap-1 mt-1 truncate">
              <Tag className="w-3 h-3" />{match.lost_item?.category || '—'}
            </p>
            {match.lost_item?.location && (
              <p className="text-xs text-secondary-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3" />{match.lost_item.location}
              </p>
            )}
          </div>

          {/* Found Item */}
          <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
            <p className="text-xs font-semibold text-accent flex items-center gap-1 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" /> FOUND
            </p>
            {foundImg && (
              <img src={`${imgBase}${foundImg}`} alt="" className="w-full h-20 object-cover rounded-xl mb-2" />
            )}
            <p className="font-semibold text-secondary-800 text-sm truncate">{match.found_item?.title || '—'}</p>
            <p className="text-xs text-secondary-500 flex items-center gap-1 mt-1 truncate">
              <Tag className="w-3 h-3" />{match.found_item?.category || '—'}
            </p>
            {match.found_item?.location && (
              <p className="text-xs text-secondary-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3" />{match.found_item.location}
              </p>
            )}
          </div>
        </div>

        {/* Expand for scores */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-primary font-medium hover:text-primary/80 transition-colors"
        >
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Score Breakdown</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              <ScoreBar label="Text Similarity" value={match.text_score} icon={FileText} />
              {match.image_score !== null && <ScoreBar label="Image Similarity" value={match.image_score} icon={Image} />}
              <ScoreBar label="Location Match" value={match.location_score} icon={MapPin} />
              <ScoreBar label="Date Proximity" value={match.date_score} icon={Calendar} />
              <div className="flex items-center gap-2 pt-1 text-xs">
                <Tag className="w-3 h-3 text-secondary-400" />
                <span className="text-secondary-500">Category:</span>
                <span className={match.category_match ? 'text-accent font-semibold' : 'text-red-500'}>
                  {match.category_match ? '✓ Match' : '✗ Different'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      {match.recovery && (
        <div className="px-5 pb-4">
          <button
            onClick={() => onViewTracking(match.recovery.id)}
            className="btn-primary btn-sm w-full"
          >
            <Shield className="w-4 h-4" /> View Recovery Tracking
          </button>
        </div>
      )}
      {!match.recovery && isPending && isOwner && (
        <div className="px-5 pb-4 flex gap-3">
          <button
            onClick={handleAccept}
            disabled={acting}
            className="btn-primary btn-sm flex-1"
          >
            {acting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accept Match
          </button>
          <button
            onClick={handleReject}
            disabled={acting}
            className="btn-secondary btn-sm flex-1 !border-red-200 !text-red-600 hover:!bg-red-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
      {!match.recovery && isPending && !isOwner && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-xs text-secondary-400 bg-secondary-50 rounded-xl p-3">
            <Clock className="w-4 h-4 flex-shrink-0" />
            Waiting for the item owner to review and accept this match.
          </div>
        </div>
      )}
      {!match.recovery && match.status === 'accepted' && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-xs text-accent bg-accent/5 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Match accepted — tracking record being created.
          </div>
        </div>
      )}
      {match.status === 'rejected' && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-xl p-3">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            This match was rejected.
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function SmartMatch() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, accepted

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await api.get('/matches')
      setMatches(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching matches:', err)
      setError('Could not load matches. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const handleAccept = async (matchId) => {
    try {
      const res = await api.post(`/matches/${matchId}/accept`)
      if (res.data.recovery_id) {
        navigate(`/tracking/${res.data.recovery_id}`)
      } else {
        fetchMatches()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept match')
    }
  }

  const handleReject = async (matchId) => {
    try {
      await api.post(`/matches/${matchId}/reject`)
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'rejected' } : m))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject match')
    }
  }

  const handleViewTracking = (recoveryId) => {
    navigate(`/tracking/${recoveryId}`)
  }

  const filtered = matches.filter(m => filter === 'all' ? true : m.status === filter)

  return (
    <AppLayout title="Smart Matches">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary-900 rounded-3xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Smart Matches</h2>
              <p className="text-secondary-300 text-sm">Hybrid matching: text + image + location + date</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{matches.filter(m => m.status === 'pending').length}</p>
              <p className="text-xs text-secondary-400">Pending Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{matches.filter(m => m.status === 'accepted').length}</p>
              <p className="text-xs text-secondary-400">Accepted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{matches.length}</p>
              <p className="text-xs text-secondary-400">Total Matches</p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-secondary-50 rounded-2xl p-1">
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === f ? 'bg-white text-primary shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-3xl border border-secondary-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Could not load matches</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <button onClick={fetchMatches} className="ml-auto btn-secondary btn-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-secondary-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-secondary-300" />
            </div>
            <h3 className="text-lg font-bold text-secondary-700 mb-2">
              {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
            </h3>
            <p className="text-secondary-400 text-sm max-w-xs mx-auto">
              {filter === 'all'
                ? 'When someone reports a found item that matches your lost report, AI matches will appear here.'
                : `You have no ${filter} matches at the moment.`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewTracking={handleViewTracking}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
