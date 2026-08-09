import { Link } from 'react-router-dom'
import { Share2, ExternalLink, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

const platformLinks = [
  { label: 'Lost Items', href: '/items?type=lost', requiresAuth: true },
  { label: 'Found Items', href: '/items?type=found', requiresAuth: true },
  { label: 'Report Item', href: '/report-lost', requiresAuth: true },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'AI Matching', href: '/#features' },
]

const companyLinks = [
  { label: 'About Us', href: '/#about' },
  { label: 'Blog', href: '/#blog' },
  { label: 'Careers', href: '/#careers' },
  { label: 'Press', href: '/#press' },
  { label: 'Contact', href: '/#contact' },
]

const universitiesLinks = [
  { label: 'Partner With Us', href: '/partner' },
  // Admin-only links — filtered by role below
  { label: 'Admin Portal', href: '/admin', roles: ['super_admin'] },
  { label: 'Uni Admin', href: '/uni-admin', roles: ['university_admin'] },
  { label: 'Moderator Tools', href: '/moderator', roles: ['university_admin', 'super_admin'] },
  { label: 'Analytics', href: '/analytics', roles: ['university_admin', 'super_admin'] },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/#privacy' },
  { label: 'Terms of Service', href: '/#terms' },
  { label: 'Cookie Policy', href: '/#cookies' },
  { label: 'Security', href: '/#security' },
]

export default function Footer() {
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) setUserRole(JSON.parse(stored)?.role || null)
    } catch { }
  }, [])

  // Filter a link list: hide links that require auth or a specific role
  const filterLinks = (links) =>
    links.filter(link => {
      if (link.roles) return link.roles.includes(userRole)   // role-restricted
      if (link.requiresAuth) return !!userRole               // auth-required
      return true                                             // public
    })

  const sections = [
    { title: 'Platform', links: filterLinks(platformLinks) },
    { title: 'Company', links: filterLinks(companyLinks) },
    { title: 'Universities', links: filterLinks(universitiesLinks) },
    { title: 'Legal', links: filterLinks(legalLinks) },
  ]

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="section-container py-16">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <span className="text-xl font-display font-bold">Found<span className="text-primary-400">IT</span></span>
            </Link>
            <p className="text-secondary-400 text-sm leading-relaxed mb-6 max-w-xs">
              The intelligent campus recovery ecosystem. Helping students securely reconnect with their lost belongings through AI-powered matching.
            </p>
            <div className="flex items-center gap-3">
              {[Share2, ExternalLink, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-surface/10 hover:bg-primary/80 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {sections.map(({ title, links }) =>
            links.length > 0 ? (
              <div key={title}>
                <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-secondary-400 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-400 text-sm">
            © 2025 FoundIT. All rights reserved. Built for campuses nationwide.
          </p>
          <div className="flex items-center gap-6 text-sm text-secondary-400">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              All systems operational
            </span>
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
