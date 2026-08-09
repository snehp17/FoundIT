import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, User, Tag, Clock, Share2, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api'

// Simple markdown-to-JSX renderer
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-bold text-secondary-900 mt-8 mb-3">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xl font-bold text-secondary-800 mt-6 mb-2">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ')) {
      // Collect list items
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(<li key={i} className="mb-1">{parseInline(lines[i].slice(2))}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside text-secondary-600 space-y-1 my-3 pl-2">{items}</ul>)
      continue
    } else if (line.startsWith('```')) {
      // Code block
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="bg-secondary-900 text-green-400 rounded-2xl p-4 my-4 overflow-x-auto font-mono text-sm">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('> ') || line.startsWith('*"')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary pl-4 italic text-secondary-600 my-4 py-2">
          {parseInline(line.replace(/^\*"/, '"').replace(/"$\*/, '"').replace(/^> /, ''))}
        </blockquote>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="text-secondary-600 leading-relaxed mb-3">{parseInline(line)}</p>)
    }
    i++
  }
  return elements
}

function parseInline(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[.*?\]\(.*?\))/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-secondary-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-secondary-100 text-primary px-1.5 py-0.5 rounded font-mono text-sm">{part.slice(1, -1)}</code>
    }
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>
    }
    return part
  })
}

const TAG_COLORS = {
  'badge-primary': 'bg-primary/10 text-primary',
  'badge-success': 'bg-accent/10 text-accent',
  'badge-warning': 'bg-warning/10 text-amber-700',
}

function estimateReadTime(content) {
  if (!content) return 1
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    api.get(`/content/blog/${id}`)
      .then(r => {
        setPost(r.data)
        // Fetch related posts
        return api.get('/content/blog')
      })
      .then(r => setRelated(r.data.filter(p => p.id !== id).slice(0, 3)))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-secondary-200 rounded-full" />
            <div className="h-10 w-3/4 bg-secondary-200 rounded-xl" />
            <div className="h-5 w-1/2 bg-secondary-100 rounded" />
            <div className="h-64 bg-secondary-200 rounded-3xl" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-secondary-100 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) return null

  const readTime = estimateReadTime(post.content)
  const tagClass = TAG_COLORS[post.tag_color] || 'bg-primary/10 text-primary'

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <div className="bg-gradient-to-b from-secondary-50 to-surface py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link to="/#blog" className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
              </Link>

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tagClass}`}>{post.tag}</span>
                <span className="flex items-center gap-1 text-xs text-secondary-400">
                  <Clock className="w-3.5 h-3.5" /> {readTime} min read
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-display font-bold text-secondary-900 leading-tight mb-4">
                {post.title}
              </h1>

              <p className="text-lg text-secondary-500 mb-6">{post.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-secondary-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" /> {post.author || 'FoundIT Team'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm text-secondary-500 hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-secondary-100"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose-custom bg-white rounded-3xl border border-secondary-100 shadow-sm p-8 md:p-12"
          >
            {renderMarkdown(post.content)}
          </motion.div>

          {/* Share / CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary-50 rounded-2xl p-6 border border-secondary-100">
            <div>
              <p className="font-semibold text-secondary-900 text-sm">Found this helpful?</p>
              <p className="text-secondary-500 text-sm">Share it with your campus community.</p>
            </div>
            <button onClick={handleShare} className="btn-primary btn-sm shrink-0">
              <Share2 className="w-4 h-4" /> {copied ? 'Link Copied!' : 'Share Article'}
            </button>
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">More from FoundIT</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(p => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="glass-card p-5 hover:shadow-lg transition-all group">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TAG_COLORS[p.tag_color] || 'bg-primary/10 text-primary'} mb-3 inline-block`}>{p.tag}</span>
                    <h3 className="font-bold text-secondary-900 text-sm leading-snug group-hover:text-primary transition-colors mb-2">{p.title}</h3>
                    <p className="text-xs text-secondary-400 flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Read More</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
