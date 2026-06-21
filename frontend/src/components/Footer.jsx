import { Link } from 'react-router-dom'
import { Compass, Share2, ExternalLink, Mail, MapPin } from 'lucide-react'

const footerLinks = {
  Platform: [
    { label: 'Lost Items', href: '/items?type=lost' },
    { label: 'Found Items', href: '/items?type=found' },
    { label: 'Report Item', href: '/report-lost' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'AI Matching', href: '/#features' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Universities: [
    { label: 'Partner With Us', href: '#' },
    { label: 'Admin Portal', href: '/admin' },
    { label: 'Moderator Tools', href: '/moderator' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'API Docs', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Security', href: '#' },
  ],
}

export default function Footer() {
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
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold text-white mb-4">{section}</h4>
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
          ))}
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
