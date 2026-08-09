import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Clock, Briefcase, CheckCircle2,
  Calendar, Send, AlertCircle, ChevronRight
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api'

function JobCard({ job, onClick }) {
  return (
    <button
      onClick={() => onClick(job)}
      className="w-full text-left glass-card p-5 border border-secondary-100 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="badge text-xs bg-primary/10 text-primary">{job.type}</span>
        <span className="text-xs text-secondary-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
      </div>
      <h3 className="font-bold text-secondary-900 text-sm group-hover:text-primary transition-colors">{job.role}</h3>
      <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{job.description}</p>
      <span className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
        View & Apply <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', cover_letter: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    setSuccess(false)
    setError('')
    setForm({ name: '', email: '', phone: '', cover_letter: '' })

    Promise.all([
      api.get(`/content/jobs/${id}`),
      api.get('/content/jobs')
    ])
      .then(([jobRes, allRes]) => {
        setJob(jobRes.data)
        setAllJobs(allRes.data.filter(j => j.id !== id))
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post(`/content/jobs/${id}/apply`, form)
      setSuccess(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-20 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-secondary-200 rounded-full" />
          <div className="h-10 w-2/3 bg-secondary-200 rounded-xl" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-secondary-100 rounded" />)}
            </div>
            <div className="h-72 bg-secondary-200 rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-20">
        {/* Header */}
        <div className="bg-gradient-to-b from-secondary-50 to-surface py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <Link to="/#careers" className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Careers
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="badge bg-primary/10 text-primary text-xs">{job.type}</span>
              <span className="flex items-center gap-1 text-sm text-secondary-500">
                <MapPin className="w-4 h-4" /> {job.location}
              </span>
              {job.apply_deadline && (
                <span className="flex items-center gap-1 text-sm text-secondary-500">
                  <Calendar className="w-4 h-4" /> Apply by {new Date(job.apply_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-2">{job.role}</h1>
            <p className="text-secondary-500">at <span className="font-semibold text-primary">FoundIT</span></p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Left: Job Details */}
            <div className="md:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border border-secondary-100">
                <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> About This Role
                </h2>
                <p className="text-secondary-600 leading-relaxed">{job.description}</p>

                {job.requirements && job.requirements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-secondary-900 mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-secondary-600 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>

              {/* Application Form */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 border border-secondary-100">
                <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> Apply for this Position
                </h2>

                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 mb-2">Application Submitted! 🎉</h3>
                    <p className="text-secondary-500 text-sm max-w-sm mx-auto">{success}</p>
                    <Link to="/#careers" className="btn-secondary btn-sm mt-6 inline-flex">
                      View Other Positions
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-error/10 text-error rounded-xl text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-secondary-700 mb-1">Full Name *</label>
                        <input
                          type="text" required className="input-field w-full" placeholder="Your full name"
                          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary-700 mb-1">Email Address *</label>
                        <input
                          type="email" required className="input-field w-full" placeholder="you@example.com"
                          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary-700 mb-1">Phone Number <span className="text-secondary-400">(optional)</span></label>
                      <input
                        type="tel" className="input-field w-full" placeholder="+91 98765 43210"
                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary-700 mb-1">Cover Letter *</label>
                      <p className="text-xs text-secondary-400 mb-1">Tell us why you are excited about this role and what you bring to the team.</p>
                      <textarea
                        rows="6" required className="input-field w-full resize-none"
                        placeholder="Hi FoundIT Team, I am excited to apply for this role because..."
                        value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })}
                      />
                      <p className="text-xs text-secondary-400 mt-1">{form.cover_letter.length} / 2000 characters</p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || form.cover_letter.length < 50}
                      className="btn-primary w-full justify-center disabled:opacity-60"
                    >
                      {submitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                    <p className="text-xs text-secondary-400 text-center">
                      By applying, you agree to our <Link to="/#privacy" className="text-primary">Privacy Policy</Link>
                    </p>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Right: Quick Info + Other Jobs */}
            <div className="space-y-6">
              <div className="glass-card p-6 border border-secondary-100 space-y-4">
                <h3 className="font-bold text-secondary-900 text-sm uppercase tracking-wide">Position Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-secondary-600">
                    <Briefcase className="w-4 h-4 text-secondary-400" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary-600">
                    <MapPin className="w-4 h-4 text-secondary-400" />
                    <span>{job.location}</span>
                  </div>
                  {job.apply_deadline && (
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Calendar className="w-4 h-4 text-secondary-400" />
                      <span>Deadline: {new Date(job.apply_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-secondary-100">
                  <p className="text-xs text-secondary-400">We review applications on a rolling basis and aim to respond within 7 business days.</p>
                </div>
              </div>

              {allJobs.length > 0 && (
                <div>
                  <h3 className="font-bold text-secondary-700 text-sm mb-3">Other Open Positions</h3>
                  <div className="space-y-3">
                    {allJobs.map(j => (
                      <Link key={j.id} to={`/jobs/${j.id}`} className="block glass-card p-4 border border-secondary-100 hover:border-primary/30 transition-all group">
                        <div className="text-xs font-semibold text-secondary-900 group-hover:text-primary">{j.role}</div>
                        <div className="text-xs text-secondary-400 mt-0.5">{j.type} · {j.location}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
