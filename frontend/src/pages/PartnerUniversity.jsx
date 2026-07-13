import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building, User, Mail, Phone, MapPin, Globe, CheckCircle2 } from 'lucide-react'
import api from '../api'
import Navbar from '../components/Navbar'

export default function PartnerUniversity() {
  const [form, setForm] = useState({
    university_name: '',
    contact_person: '',
    designation: '',
    official_email: '',
    phone_number: '',
    website: '',
    city: '',
    state: '',
    country: '',
    number_of_students: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const payload = {
        ...form,
        number_of_students: form.number_of_students ? parseInt(form.number_of_students, 10) : null
      }
      const response = await api.post('/auth/university-request', payload);
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-mesh pt-24 pb-12">
      <Navbar />
      <div className="section-container max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-secondary-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-3xl p-12 text-center border border-secondary-200 shadow-xl"
          >
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-secondary-900 mb-4">Request Submitted Successfully!</h1>
            <p className="text-secondary-600 text-lg mb-8 max-w-md mx-auto">
              Thank you for your interest in partnering with FoundIT. Our team will review your application and contact you at {form.official_email} within 2-3 business days.
            </p>
            <button onClick={() => setSubmitted(false)} className="btn-primary">
              Submit Another Request
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-3xl p-8 md:p-12 border border-secondary-200 shadow-xl"
          >
            <div className="mb-10 text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-secondary-900 mb-4">
                Partner with <span className="text-primary">FoundIT</span>
              </h1>
              <p className="text-secondary-600 max-w-xl mx-auto">
                Join our network of universities and provide your students with a modern, efficient, and AI-powered lost and found ecosystem.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Institution Details */}
              <div>
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Institution Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-secondary-700">University Name *</label>
                    <input type="text" name="university_name" required value={form.university_name} onChange={handleChange} className="input-field" placeholder="E.g. Harvard University" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Website</label>
                    <input type="url" name="website" value={form.website} onChange={handleChange} className="input-field" placeholder="https://" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Number of Students</label>
                    <input type="number" name="number_of_students" value={form.number_of_students} onChange={handleChange} className="input-field" placeholder="E.g. 15000" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">City *</label>
                    <input type="text" name="city" required value={form.city} onChange={handleChange} className="input-field" placeholder="City" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">State/Province *</label>
                    <input type="text" name="state" required value={form.state} onChange={handleChange} className="input-field" placeholder="State" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Country *</label>
                    <input type="text" name="country" required value={form.country} onChange={handleChange} className="input-field" placeholder="Country" />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Contact Person
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Full Name *</label>
                    <input type="text" name="contact_person" required value={form.contact_person} onChange={handleChange} className="input-field" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Designation *</label>
                    <input type="text" name="designation" required value={form.designation} onChange={handleChange} className="input-field" placeholder="E.g. Dean of Students" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Official Email *</label>
                    <input type="email" name="official_email" required value={form.official_email} onChange={handleChange} className="input-field" placeholder="john@university.edu" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-secondary-700">Phone Number *</label>
                    <input type="tel" name="phone_number" required value={form.phone_number} onChange={handleChange} className="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-700">Additional Information / Message</label>
                <textarea name="message" rows="4" value={form.message} onChange={handleChange} className="input-field resize-none" placeholder="Tell us about your campus needs..." />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
                {loading ? 'Submitting Application...' : 'Submit Partnership Request'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}
