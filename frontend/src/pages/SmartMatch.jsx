import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { Brain, CheckCircle2, XCircle, MapPin, Clock, Tag, ArrowRight, ShieldCheck } from 'lucide-react'
import api from '../api'

const matchData = {
  lost: {
    title: 'MacBook Pro 14" Silver',
    category: 'Electronics',
    location: 'Main Library',
    date: 'Jun 19, 2025',
    color: 'Space Gray',
    desc: 'M3 chip, blue sticker near Apple logo, scratch on bottom left corner',
  },
  found: {
    title: 'Silver Laptop (Apple)',
    category: 'Electronics',
    location: 'Cafeteria Adjacent',
    date: 'Jun 19, 2025',
    color: 'Silver/Gray',
    desc: 'Apple laptop found near Main Library entrance, has sticker on lid, charger not found',
  },
  confidence: 87,
  attributes: [
    { name: 'Category', match: true, lost: 'Electronics', found: 'Electronics' },
    { name: 'Brand', match: true, lost: 'Apple / MacBook', found: 'Apple Laptop' },
    { name: 'Color', match: true, lost: 'Space Gray', found: 'Silver/Gray' },
    { name: 'Location', match: true, lost: 'Main Library', found: 'Near Main Library' },
    { name: 'Date', match: true, lost: 'Jun 19', found: 'Jun 19' },
    { name: 'Description', match: true, lost: 'Sticker on lid', found: 'Sticker on lid ✓' },
    { name: 'Accessories', match: false, lost: 'With bag', found: 'No bag found' },
  ]
}

export default function SmartMatch() {
  const [searchParams] = useSearchParams()
  const foundId = searchParams.get('foundId')
  const lostId = searchParams.get('lostId')

  const [loading, setLoading] = useState(true)
  const [matchData, setMatchData] = useState(null)

  useEffect(() => {
    if (!foundId || !lostId) {
      setLoading(false)
      return
    }

    const fetchMatches = async () => {
      try {
        const foundRes = await api.get(`/items/${foundId}`)
        const lostRes = await api.get(`/items/${lostId}`)
        
        const foundItem = foundRes.data
        const lostItem = lostRes.data

        setMatchData({
          lost: {
            title: lostItem.title,
            category: lostItem.category,
            location: lostItem.location,
            date: new Date(lostItem.date).toLocaleDateString(),
            color: 'N/A', // Update if color is added to DB
            desc: lostItem.description,
            user_id: lostItem.user_id,
            id: lostItem.id
          },
          found: {
            title: foundItem.title,
            category: foundItem.category,
            location: foundItem.location,
            date: new Date(foundItem.date).toLocaleDateString(),
            color: 'N/A', // Update if color is added to DB
            desc: foundItem.description,
            user_id: foundItem.user_id,
            id: foundItem.id
          },
          confidence: 85, // Mock confidence score for now
          attributes: [
            { name: 'Category', match: lostItem.category === foundItem.category, lost: lostItem.category, found: foundItem.category },
            { name: 'Location', match: lostItem.location === foundItem.location, lost: lostItem.location, found: foundItem.location },
            { name: 'Date', match: lostItem.date === foundItem.date, lost: new Date(lostItem.date).toLocaleDateString(), found: new Date(foundItem.date).toLocaleDateString() },
          ]
        })
      } catch (err) {
        console.error("Error fetching match data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [foundId, lostId])

  if (loading) return <AppLayout title="Smart AI Match"><div className="p-8 text-center">Loading match data...</div></AppLayout>
  if (!matchData) return <AppLayout title="Smart AI Match"><div className="p-8 text-center text-error">Match data not found.</div></AppLayout>

  return (
    <AppLayout title="Smart AI Match">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* AI Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary-900 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary-300">AI Confidence Score</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Potential Match Found!</h2>
              <p className="text-secondary-400 mt-1">Our AI found a high-confidence match for your lost item.</p>
            </div>
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <motion.circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  initial={{ strokeDashoffset: 251 }}
                  animate={{ strokeDashoffset: 251 - (251 * matchData.confidence / 100) }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{matchData.confidence}%</span>
                <span className="text-xs text-secondary-400">Confident</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Side-by-Side Comparison */}
        <div className="grid lg:grid-cols-2 gap-5">
          {[
            { label: 'YOUR LOST ITEM', data: matchData.lost, color: 'border-error/20 bg-error/5', badge: 'badge-error' },
            { label: 'FOUND ITEM MATCH', data: matchData.found, color: 'border-accent/20 bg-accent/5', badge: 'badge-success' },
          ].map(({ label, data, color, badge }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-surface rounded-3xl border-2 ${color} shadow-md p-5`}
            >
              <span className={`badge text-xs mb-4 ${badge}`}>{label}</span>
              <div className="h-36 bg-secondary-100 rounded-2xl flex items-center justify-center text-5xl mb-4">💻</div>
              <h3 className="font-bold text-secondary-900 mb-3">{data.title}</h3>
              <div className="space-y-2">
                {[
                  { icon: Tag, label: 'Category', value: data.category },
                  { icon: MapPin, label: 'Location', value: data.location },
                  { icon: Clock, label: 'Date', value: data.date },
                  { icon: Tag, label: 'Color', value: data.color },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="w-3.5 h-3.5 text-secondary-400" />
                    <span className="text-secondary-400">{label}:</span>
                    <span className="font-medium text-secondary-900">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-secondary-500 mt-3 italic">"{data.desc}"</p>
            </motion.div>
          ))}
        </div>

        {/* Attribute Breakdown */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Attribute Matching Breakdown
          </h3>
          <div className="space-y-3">
            {matchData.attributes.map((attr, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${attr.match ? 'bg-accent/5' : 'bg-error/5'}`}>
                {attr.match
                  ? <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  : <XCircle className="w-5 h-5 text-error flex-shrink-0" />
                }
                <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                  <span className="font-semibold text-secondary-900">{attr.name}</span>
                  <span className="text-secondary-600">{attr.lost}</span>
                  <span className="text-secondary-600">{attr.found}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-end">
          <button className="btn-secondary gap-2 text-error border-error/20 hover:bg-error/5">
            <XCircle className="w-4 h-4" />
            Reject Match
          </button>
          <Link to={`/chat?peerId=${matchData.found.user_id}&itemId=${matchData.found.id}`} className="btn-primary gap-2">
            <ShieldCheck className="w-4 h-4" />
            Initiate Secure Chat
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
