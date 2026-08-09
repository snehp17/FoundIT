import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api'
import {
  Search, Upload, Brain, ShieldCheck, MessageSquare, Bell,
  BarChart2, QrCode, TrendingUp, ArrowRight, CheckCircle2,
  XCircle, Users, Building2, Star, ChevronDown, Zap,
  MapPin, Clock, Package, ChevronRight, Play,
  Smartphone, Globe, Award, Lock, FileText, Send, Mail, Briefcase
} from 'lucide-react'

// Animated Counter
function Counter({ end, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const increment = end / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// Section Wrapper with animation
function Section({ children, className = '', id }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

const trustStats = [
  { value: 4500000, suffix: '+', label: 'Items Lost Annually', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  { value: 50, suffix: '%', label: 'Students Affected', icon: Users, color: 'text-error', bg: 'bg-error/10' },
  { value: 33, suffix: '%', label: 'Never Recovered', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  { value: 60000, suffix: '+', label: 'Campus Incidents/Year', icon: Building2, color: 'text-accent', bg: 'bg-accent/10' },
]

const features = [
  { icon: Upload, title: 'Instant Reporting', desc: 'Upload photos and item details in under 60 seconds with our intuitive reporting flow.', color: 'text-primary', bg: 'icon-bg-blue' },
  { icon: Brain, title: 'Smart AI Matching', desc: 'Automatically compare descriptions, categories and images for intelligent pairing.', color: 'text-purple-600', bg: 'icon-bg-purple' },
  { icon: ShieldCheck, title: 'Ownership Verification', desc: 'Challenge questions and hidden item details ensure only real owners reclaim items.', color: 'text-accent', bg: 'icon-bg-green' },
  { icon: MessageSquare, title: 'Secure Messaging', desc: 'Private communication without exposing personal contact information.', color: 'text-primary', bg: 'icon-bg-blue' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Real-time match alerts via push, email, and in-app channels.', color: 'text-warning', bg: 'icon-bg-amber' },
  { icon: TrendingUp, title: 'Recovery Tracking', desc: 'Track every stage from report to return with a visual timeline.', color: 'text-accent', bg: 'icon-bg-green' },
  { icon: QrCode, title: 'QR Based Recovery', desc: 'Campus pickup verification using dynamic QR codes for secure handover.', color: 'text-error', bg: 'icon-bg-red' },
  { icon: BarChart2, title: 'Analytics Dashboard', desc: 'Monitor recovery rates, trends and campus hotspots in real-time.', color: 'text-purple-600', bg: 'icon-bg-purple' },
]
const painPoints = [
  { icon: Globe, title: 'Fragmented Reporting', desc: 'Items scattered across WhatsApp groups, Facebook pages, and notice boards with no central system.' },
  { icon: Package, title: 'Duplicate Posts', desc: 'Same lost item reported multiple times creating confusion and wasting everyone\'s time.' },
  { icon: ShieldCheck, title: 'No Ownership Verification', desc: 'Anyone can claim any item. There\'s no way to prove an item truly belongs to someone.' },
  { icon: Lock, title: 'Security Risks', desc: 'Sharing personal phone numbers and emails with strangers to arrange meetups is dangerous.' },
  { icon: TrendingUp, title: 'Low Recovery Rate', desc: 'Without structured matching, most lost items are never reunited with their owners.' },
  { icon: Bell, title: 'Poor Visibility', desc: 'Posts get buried in feeds within hours. Found items sit unclaimed for weeks or months.' },
]
const steps = [
  { step: '01', title: 'Report Item', desc: 'Submit photos and details of your lost or found item in our structured form.', icon: Upload },
  { step: '02', title: 'Categorization', desc: 'AI automatically categorizes and tags your item for optimal searchability.', icon: Brain },
  { step: '03', title: 'AI Matching', desc: 'Smart algorithms compare your report against all active listings for matches.', icon: Search },
  { step: '04', title: 'Match Alert', desc: 'Receive instant notification when a potential match is found.', icon: Bell },
  { step: '05', title: 'Verification', desc: 'Answer ownership challenge questions to prove the item belongs to you.', icon: ShieldCheck },
  { step: '06', title: 'Secure Handover', desc: 'Coordinate safe item exchange through our moderated messaging system.', icon: MessageSquare },
  { step: '07', title: 'Recovery Completed', desc: 'Item returned, both parties confirmed. Recovery logged and celebrated! 🎉', icon: CheckCircle2 },
]

const roles = [
  { icon: Users, title: 'Student', desc: 'Submit lost/found reports, receive match alerts, verify ownership and track recovery progress.', color: 'bg-primary/10 text-primary', actions: ['Report Items', 'View Matches', 'Track Recovery', 'Chat Securely'] },
  { icon: Search, title: 'Finder', desc: 'Upload found items, manage incoming claims and coordinate handovers safely.', color: 'bg-accent/10 text-green-700', actions: ['Upload Found', 'Review Claims', 'Verify Owners', 'Arrange Handover'] },
  { icon: ShieldCheck, title: 'Moderator', desc: 'Review reported items, detect fraud, resolve disputes and maintain platform integrity.', color: 'bg-warning/10 text-amber-700', actions: ['Review Reports', 'Flag Fraud', 'Resolve Disputes', 'Activity Log'] },
  { icon: BarChart2, title: 'Administrator', desc: 'Manage campus settings, monitor analytics, oversee all operations and configure the system.', color: 'bg-error/10 text-red-700', actions: ['Manage Campus', 'View Analytics', 'User Management', 'System Config'] },
]

const futureTech = [
  { icon: Brain, title: 'AI Image Recognition', desc: 'Automatic item detection and classification from uploaded photos using computer vision.', gradient: 'from-blue-500 to-violet-600' },
  { icon: MapPin, title: 'Smart Maps', desc: 'Last-seen location intelligence with heat maps showing campus loss hotspots.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Star, title: 'Trust Score System', desc: 'Reputation-based recovery scores that reward honest, verified users over time.', gradient: 'from-amber-500 to-orange-600' },
  { icon: Globe, title: 'Multi-Campus Network', desc: 'Interconnected university ecosystem allowing cross-campus item discovery.', gradient: 'from-pink-500 to-rose-600' },
  { icon: Smartphone, title: 'Mobile Application', desc: 'Native Android and iOS app with offline capability and push notifications.', gradient: 'from-indigo-500 to-blue-600' },
  { icon: Award, title: 'Reward System', desc: 'Gamified badges and rewards for finders who help the community recover items.', gradient: 'from-violet-500 to-purple-600' },
]

// ─── DYNAMIC SECTIONS ────────────────────────────────────────────────────────

function BlogSection() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/content/blog')
      .then(r => setPosts(r.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Section className="section-padding bg-secondary-50" id="blog">
      <div className="section-container">
        <div className="text-center mb-16">
          <div className="inline-block badge-primary mb-4">Latest Insights</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
            FoundIT Blog & <span className="text-gradient">Updates</span>
          </h2>
          <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
            Stay updated on campus safety best practices, AI technology updates, and university partnerships.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-6 space-y-3 animate-pulse">
                  <div className="flex justify-between"><div className="h-5 w-24 bg-secondary-200 rounded-full" /><div className="h-4 w-20 bg-secondary-100 rounded" /></div>
                  <div className="h-5 w-full bg-secondary-200 rounded" />
                  <div className="h-4 w-3/4 bg-secondary-100 rounded" />
                  <div className="h-4 w-5/6 bg-secondary-100 rounded" />
                </div>
              ))
            : posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`} className="glass-card p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge text-xs ${post.tag_color || 'badge-primary'}`}>{post.tag}</span>
                      <span className="text-xs text-secondary-400">
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-secondary-900 text-lg mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-secondary-500 leading-relaxed mb-6">{post.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    Read Full Post <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              ))
          }
        </div>
      </div>
    </Section>
  )
}

function CareersSection() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/content/jobs')
      .then(r => setJobs(r.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Section className="section-padding bg-surface" id="careers">
      <div className="section-container">
        <div className="text-center mb-16">
          <div className="inline-block badge-primary mb-4">We Are Hiring</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
            Join Our Mission at <span className="text-gradient">FoundIT</span>
          </h2>
          <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
            Help us expand to campuses nationwide and engineer next-gen recovery tools.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-6 space-y-3 animate-pulse border border-secondary-100">
                  <div className="h-5 w-32 bg-secondary-200 rounded-full" />
                  <div className="h-5 w-full bg-secondary-200 rounded" />
                  <div className="h-4 w-5/6 bg-secondary-100 rounded" />
                  <div className="h-9 w-full bg-secondary-200 rounded-xl mt-4" />
                </div>
              ))
            : jobs.map((job) => (
                <div key={job.id} className="glass-card p-6 border border-secondary-100 flex flex-col justify-between hover:shadow-lg hover:border-primary/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge text-xs bg-primary/10 text-primary">{job.type}</span>
                      <span className="text-xs text-secondary-400">{job.location}</span>
                    </div>
                    <h3 className="font-bold text-secondary-900 text-lg mb-2">{job.role}</h3>
                    <p className="text-sm text-secondary-500 leading-relaxed mb-6 line-clamp-3">{job.description}</p>
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="btn-secondary btn-sm w-full justify-center"
                  >
                    View & Apply
                  </Link>
                </div>
              ))
          }
        </div>
      </div>
    </Section>
  )
}

function PressSection() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/content/press')
      .then(r => setArticles(r.data))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Section className="section-padding bg-secondary-50" id="press">
      <div className="section-container">
        <div className="text-center mb-16">
          <div className="inline-block badge-primary mb-4">Press & Media</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
            FoundIT in the <span className="text-gradient">News</span>
          </h2>
          <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
            Read how FoundIT is modernizing lost-and-found operations across higher education.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="glass-card p-8 border border-secondary-100 space-y-3 animate-pulse">
                  <div className="h-3 w-32 bg-secondary-200 rounded" />
                  <div className="h-6 w-full bg-secondary-200 rounded" />
                  <div className="h-4 w-5/6 bg-secondary-100 rounded" />
                  <div className="h-4 w-24 bg-secondary-200 rounded" />
                </div>
              ))
            : articles.map((article) => (
                <div key={article.id} className="glass-card p-8 border border-secondary-100">
                  <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${article.source_color || 'text-primary'}`}>
                    {article.source}
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-3">{article.title}</h3>
                  <p className="text-sm text-secondary-500 leading-relaxed mb-6">{article.description}</p>
                  <a
                    href={article.link_url || '#'}
                    target={article.link_url && article.link_url !== '#' ? '_blank' : undefined}
                    rel="noreferrer"
                    className={`text-sm font-semibold inline-flex items-center gap-1 ${article.source_color || 'text-primary'}`}
                  >
                    {article.link_label}
                  </a>
                </div>
              ))
          }
        </div>
      </div>
    </Section>
  )
}

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/content/contact', form)
      setSuccess(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section className="section-padding bg-surface" id="contact">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-block badge-primary mb-4">Contact Us</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
            Get in Touch with <span className="text-gradient">FoundIT</span>
          </h2>
          <p className="text-secondary-500 text-lg max-w-xl mx-auto">
            Have questions about your campus integration, support, or partnership inquiries? Send us a message!
          </p>
        </div>

        {success ? (
          <div className="glass-card p-12 border border-accent/30 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-2">Message Received!</h3>
            <p className="text-secondary-500 mb-6">The FoundIT team will respond within 24 hours.</p>
            <button onClick={() => setSuccess(false)} className="btn-primary">Send Another Message</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-8 border border-secondary-100 space-y-4">
            {error && <div className="p-3 bg-error/10 text-error rounded-xl text-sm">{error}</div>}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary-700 mb-1">Your Name</label>
                <input
                  type="text" required placeholder="Alex Smith" className="input-field w-full"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary-700 mb-1">Email Address</label>
                <input
                  type="email" required placeholder="alex@university.edu" className="input-field w-full"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary-700 mb-1">University / Subject</label>
              <input
                type="text" required placeholder="e.g. Parul University or General Question" className="input-field w-full"
                value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary-700 mb-1">Message</label>
              <textarea
                rows="4" required placeholder="How can we help you?" className="input-field w-full"
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </Section>
  )
}



const faqs = [
  {
    q: 'How does ownership verification work?',
    a: 'When you claim an item, you must answer specific questions about the item that only the real owner would know — like unique markings, contents, or purchase details. The finder also validates your answers before handing over.',
  },
  {
    q: 'Is my personal data secure?',
    a: 'Absolutely. We never expose your phone number or email to other users. All communication happens through our masked messaging system. Your data is encrypted and never sold to third parties.',
  },
  {
    q: 'How does the AI matching work?',
    a: 'Our AI analyzes item descriptions, categories, photos, last-seen locations, and timestamps to calculate a match confidence score. High-confidence matches trigger instant notifications to both parties.',
  },
  {
    q: 'Can multiple campuses use FoundIT?',
    a: 'Yes! FoundIT is built as a multi-tenant platform. Each university gets its own isolated ecosystem with custom branding, while our cross-campus network allows items to be discovered even if lost during inter-campus events.',
  },
  {
    q: 'Is FoundIT free for students?',
    a: 'Students use FoundIT completely free. Universities subscribe to our institutional plan which covers the entire campus. We also offer a free tier for smaller institutions getting started.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-secondary-100 rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-secondary-50 transition-colors"
      >
        <span className="font-semibold text-secondary-900">{q}</span>
        <ChevronDown className={`w-5 h-5 text-secondary-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-5 text-secondary-600 leading-relaxed border-t border-secondary-100">
              <p className="pt-4">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [location])

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                background: i % 2 === 0 ? 'radial-gradient(circle, #2563EB, transparent)' : 'radial-gradient(circle, #22C55E, transparent)',
                top: `${10 + i * 15}%`,
                left: `${i * 18}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 6 + i * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.8,
              }}
            />
          ))}
        </div>

        <div className="section-container relative z-10 flex flex-col items-center text-center py-32 max-w-4xl mx-auto">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 badge-primary text-sm mb-6 py-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Campus Recovery Ecosystem
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-secondary-900 leading-[1.08] mb-6"
          >
            Lost Something?{' '}
            <span className="text-gradient">Found Something?</span>
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl">Reconnect Through FoundIT.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-secondary-500 leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            A smart digital recovery ecosystem helping students securely recover lost belongings through <strong className="text-secondary-900">AI-powered matching</strong>, ownership verification and private communication.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <Link to="/select-university" className="btn-primary btn-lg">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="btn-secondary btn-lg group">
              <Play className="w-5 h-5 group-hover:text-primary" />
              Explore Platform
            </button>
          </motion.div>

        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-secondary-400"
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>





      {/* ─── PROBLEM ─── */}
      <Section className="section-padding bg-surface" id="problem">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left – illustration */}
            <div>
              <div className="inline-block badge-error mb-4">The Problem</div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
                Current Methods are{' '}
                <span className="text-error">Broken</span>
              </h2>
              <p className="text-secondary-500 text-lg mb-8">
                Students rely on fragmented, inefficient channels that create chaos, security risks, and ultimately lead to permanent item loss.
              </p>

              {/* Chaos illustration */}
              <div className="relative glass-card p-6 border border-secondary-200">
                <div className="text-xs font-semibold text-secondary-400 mb-4 uppercase tracking-wider">Current Reality</div>
                {[
                  { platform: 'WhatsApp Group', msg: 'Lost my laptop in canteen!! Anyone??', time: '09:24', color: 'bg-[#25D366]', icon: <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.122.548 4.195 1.594 6.02L.031 24l6.109-1.602a11.97 11.97 0 005.891 1.539h.008c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zm0 21.968h-.008a9.986 9.986 0 01-5.086-1.383l-.367-.219-3.781.992 1.008-3.688-.234-.375A9.98 9.98 0 012.031 12.03c0-5.516 4.484-10 10-10s10 4.484 10 10-4.484 10-10 10zm5.492-7.516c-.305-.148-1.781-.883-2.055-.984-.281-.102-.484-.148-.688.148-.203.305-.781.984-.961 1.188-.18.203-.359.227-.664.078-.305-.148-1.273-.469-2.422-1.492-.898-.805-1.508-1.797-1.688-2.102-.18-.305-.023-.469.125-.617.133-.133.305-.359.453-.539.148-.18.203-.305.305-.508.102-.203.055-.383-.023-.531-.078-.148-.688-1.656-.945-2.266-.25-.594-.5-.516-.688-.523-.18-.008-.383-.008-.586-.008-.203 0-.539.078-.82.383-.281.305-1.078 1.055-1.078 2.578 0 1.523 1.102 2.992 1.258 3.203.148.203 2.188 3.336 5.305 4.688.742.32 1.32.508 1.773.648.742.234 1.422.203 1.953.125.594-.086 1.781-.727 2.031-1.43.25-.703.25-1.305.18-1.43-.078-.133-.281-.203-.586-.352z"/></svg> },
                  { platform: 'Facebook', msg: 'Found: Black bag near library entrance', time: '11:45', color: 'bg-[#1877F2]', icon: <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                  { platform: 'Notice Board', msg: '📌 LOST: Student ID Card - Contact xyz', time: '2 days ago', color: 'bg-amber-500', icon: <Globe className="w-4 h-4 text-white" /> },
                  { platform: 'Instagram Story', msg: 'Anyone find my airpods?? Swipe up 🙏', time: '18:30', color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]', icon: <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl mb-3 border border-secondary-200 bg-surface/50 ${i === 1 ? 'opacity-60' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-secondary-900">{item.platform}</span>
                        <span className="text-xs text-secondary-400">{item.time}</span>
                      </div>
                      <p className="text-sm text-secondary-600 truncate">{item.msg}</p>
                    </div>
                    <XCircle className="w-4 h-4 text-error flex-shrink-0" />
                  </div>
                ))}
                <div className="text-center text-sm text-secondary-400 mt-2">...and 47 more scattered posts 😢</div>
              </div>
            </div>

            {/* Right – Pain points */}
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="glass-card p-5 hover:shadow-xl transition-all duration-300"
                >
                  <div className="icon-bg-red mb-3">
                    <point.icon className="w-5 h-5 text-error" />
                  </div>
                  <h3 className="font-semibold text-secondary-900 mb-1.5">{point.title}</h3>
                  <p className="text-sm text-secondary-500 leading-relaxed">{point.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── SOLUTION COMPARISON ─── */}
      <Section className="section-padding bg-surface" id="solution">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">The Solution</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Traditional vs{' '}
              <span className="text-gradient">FoundIT</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
              See the difference a purpose-built, intelligent platform makes compared to the current patchwork of social media and notice boards.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Traditional */}
            <div className="bg-secondary-50 rounded-3xl p-8 border border-secondary-100">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">😩</div>
                <h3 className="text-xl font-bold text-secondary-900">Traditional Method</h3>
                <p className="text-sm text-secondary-400 mt-1">Scattered & ineffective</p>
              </div>
              <div className="space-y-3">
                {['WhatsApp Groups', 'Facebook Posts', 'Notice Boards', 'No Tracking', 'No Verification', 'Privacy Risks', 'Low Recovery'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-error flex-shrink-0" />
                    <span className="text-secondary-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-secondary-200 flex items-center justify-center">
                <span className="text-2xl font-black text-secondary-400">VS</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center"
              >
                <div className="w-1 h-24 bg-gradient-to-b from-secondary-200 via-primary to-accent rounded-full mx-auto" />
              </motion.div>
            </div>

            {/* FoundIT */}
            <div className="bg-primary/5 rounded-3xl p-8 border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-8 translate-x-8" />
              <div className="text-center mb-8 relative">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-xl font-bold text-primary">FoundIT Platform</h3>
                <p className="text-sm text-primary/60 mt-1">Intelligent & secure</p>
              </div>
              <div className="space-y-3 relative">
                {['Centralized Platform', 'AI Smart Matching', 'Ownership Verification', 'Recovery Tracking', 'Secure Messaging', 'Privacy Protection', '78% Recovery Rate'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-secondary-700 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── FEATURES ─── */}
      <Section className="section-padding bg-secondary-50" id="features">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">Core Features</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Everything You Need to{' '}
              <span className="text-gradient">Recover What Matters</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
              Eight powerful features working together to create the most comprehensive campus recovery ecosystem ever built.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="glass-card p-6 cursor-pointer group"
              >
                <div className={`${feature.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-secondary-900 mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-secondary-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── HOW IT WORKS ─── */}
      <Section className="section-padding bg-surface" id="how-it-works">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              From Report to{' '}
              <span className="text-gradient">Recovery in 7 Steps</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary hidden lg:block" />

            <div className="grid lg:grid-cols-7 gap-6 relative">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border-2 border-primary/20 shadow-md mb-4 mx-auto group hover:border-primary hover:shadow-blue-200 transition-all duration-300">
                    <step.icon className="w-7 h-7 text-primary" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-secondary-900 text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-secondary-400 leading-relaxed hidden lg:block">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>



      {/* ─── ROLES ─── */}
      <Section className="section-padding bg-surface" id="roles">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">Role-Based Access</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Built for Every{' '}
              <span className="text-gradient">Stakeholder</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
              Role-based access control ensures every user has exactly the tools they need — nothing more, nothing less.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl ${role.color} flex items-center justify-center mb-4`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-secondary-900 text-lg mb-2">{role.title}</h3>
                <p className="text-sm text-secondary-500 mb-4 leading-relaxed">{role.desc}</p>
                <div className="space-y-1.5">
                  {role.actions.map((action) => (
                    <div key={action} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <span className="text-xs text-secondary-600">{action}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FUTURE TECH ─── */}
      <Section className="section-padding bg-secondary-50" id="future">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">Roadmap</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              The Future of{' '}
              <span className="text-gradient">Campus Recovery</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-2xl mx-auto">
              We're just getting started. Here's what's coming to make FoundIT the most advanced recovery platform on the planet.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {futureTech.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass-card p-6 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <tech.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-secondary-900 mb-2">{tech.title}</h3>
                <p className="text-sm text-secondary-500 leading-relaxed">{tech.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-secondary-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                  Coming Soon
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>



      {/* ─── FAQ ─── */}
      <Section className="section-padding bg-secondary-50" id="faq">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-block badge-primary mb-4">FAQ</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Frequently Asked{' '}
              <span className="text-gradient">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FINAL CTA ─── */}
      <Section className="section-padding bg-surface" id="cta">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-4xl bg-secondary-900 p-12 md:p-20 text-center"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 badge bg-surface/20 text-white mb-6">
                <Zap className="w-3.5 h-3.5" />
                Join 12,000+ students already using FoundIT
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                Ready to Recover<br />
                <span className="text-gradient-accent">What Matters?</span>
              </h2>
              <p className="text-secondary-400 text-xl mb-10 max-w-xl mx-auto">
                Join the next generation campus recovery ecosystem and give your belongings the best chance of coming home.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/select-university" className="btn-primary btn-lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/dashboard" className="btn-lg inline-flex items-center gap-2 px-8 py-4 bg-surface/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-surface/20 transition-all duration-300">
                  <Play className="w-5 h-5" />
                  View Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── ABOUT US ─── */}
      <Section className="section-padding bg-surface" id="about">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">About FoundIT</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Building the World's Smartest{' '}
              <span className="text-gradient">Campus Recovery Network</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-3xl mx-auto leading-relaxed">
              FoundIT was created to solve a problem every student faces: losing valuable belongings on a busy campus with no centralized way to recover them. By combining cutting-edge AI similarity matching, automated verification, and secure communication, we empower university communities to reconnect people with what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center border border-secondary-100">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">AI Innovation</h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                Utilizing vector embeddings and image recognition to match lost items with reported found items instantly.
              </p>
            </div>
            <div className="glass-card p-8 text-center border border-secondary-100">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Trust & Safety</h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                Verification questions and masked messaging ensure items are only returned to verified owners.
              </p>
            </div>
            <div className="glass-card p-8 text-center border border-secondary-100">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-5">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Campus Ecosystem</h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                Seamlessly integrated with university admin dashboards, security offices, and student bodies.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── BLOG ─── */}
      <BlogSection />

      {/* ─── CAREERS ─── */}
      <CareersSection />

      {/* ─── PRESS ─── */}
      <PressSection />

      {/* ─── CONTACT ─── */}
      <ContactSection />

      {/* ─── API DOCS ─── */}
      <Section className="section-padding bg-secondary-50" id="api-docs">
        <div className="section-container max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-block badge-primary mb-4">Developer Hub</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              FoundIT <span className="text-gradient">API Documentation</span>
            </h2>
            <p className="text-secondary-500 text-lg max-w-xl mx-auto">
              Integrate FoundIT with your campus mobile app, student portal, or security logs using our RESTful endpoints.
            </p>
          </div>

          <div className="bg-secondary-900 text-white rounded-3xl p-6 md:p-8 font-mono text-sm shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 text-xs text-secondary-400">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                FoundIT v2 REST API Specification
              </span>
              <span>Host: http://localhost:5000</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-accent font-semibold mb-1">GET /api/items</div>
                <div className="text-secondary-300 text-xs">// Fetch active lost/found listings filtered by university_id</div>
                <div className="bg-black/50 p-3 rounded-xl text-xs text-green-400 overflow-x-auto">
                  {`curl -X GET "http://localhost:5000/api/items?type=LOST" \\
  -H "Authorization: Bearer <JWT_TOKEN>"`}
                </div>
              </div>
              <div>
                <div className="text-accent font-semibold mb-1">POST /api/items/report</div>
                <div className="text-secondary-300 text-xs">// Submit new item report with multipart image payload</div>
              </div>
              <div>
                <div className="text-accent font-semibold mb-1">GET /api/admin/analytics</div>
                <div className="text-secondary-300 text-xs">// Retrieve campus analytics metrics</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── LEGAL & SECURITY ─── */}
      <Section className="section-padding bg-surface" id="legal">
        <div className="section-container max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-block badge-primary mb-4">Legal & Compliance</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
              Privacy, Security & <span className="text-gradient">Terms</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div id="privacy" className="glass-card p-6 border border-secondary-100">
              <h3 className="font-bold text-secondary-900 text-lg mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Privacy Policy
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                FoundIT collects only essential account metadata (name, university email, role) necessary to authenticate campus members. Personal phone numbers and emails are never displayed to other users.
              </p>
            </div>
            <div id="terms" className="glass-card p-6 border border-secondary-100">
              <h3 className="font-bold text-secondary-900 text-lg mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Terms of Service
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                By using FoundIT, students agree to submit authentic lost/found reports. Fraudulent claims, fake reports, or misuse of platform messaging will result in immediate account suspension.
              </p>
            </div>
            <div id="cookies" className="glass-card p-6 border border-secondary-100">
              <h3 className="font-bold text-secondary-900 text-lg mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-warning" /> Cookie Policy
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                We use strictly functional local session tokens to keep users authenticated. No third-party tracking cookies or advertising pixels are deployed on FoundIT.
              </p>
            </div>
            <div id="security" className="glass-card p-6 border border-secondary-100">
              <h3 className="font-bold text-secondary-900 text-lg mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" /> Security Standards
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                All API communications are encrypted over HTTPS. Database access is governed by Supabase Row Level Security (RLS) policies ensuring users can only view authorized campus data.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  )
}
