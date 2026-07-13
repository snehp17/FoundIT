import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  Upload, MapPin, Camera, CheckCircle2, ChevronRight, ChevronLeft,
  X, Plus, AlertCircle, Laptop, BookOpen, Watch, Key, CreditCard, Backpack, Headphones, ShoppingBag
} from 'lucide-react'

const categories = [
  { id: 'electronics', label: 'Electronics', icon: Laptop, color: 'text-blue-500 bg-blue-50' },
  { id: 'books', label: 'Books', icon: BookOpen, color: 'text-amber-500 bg-amber-50' },
  { id: 'accessories', label: 'Accessories', icon: Watch, color: 'text-purple-500 bg-purple-50' },
  { id: 'keys', label: 'Keys / Cards', icon: Key, color: 'text-green-500 bg-green-50' },
  { id: 'documents', label: 'Documents', icon: CreditCard, color: 'text-red-500 bg-red-50' },
  { id: 'bags', label: 'Bags', icon: Backpack, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'audio', label: 'Audio', icon: Headphones, color: 'text-pink-500 bg-pink-50' },
  { id: 'other', label: 'Other', icon: ShoppingBag, color: 'text-gray-500 bg-gray-50' },
]

const campusLocations = [
  'Main Library', 'Cafeteria', 'Lecture Hall Block A', 'Lecture Hall Block B',
  'Sports Complex', 'Bus Stop / Main Gate', 'Computer Lab', 'Admin Block',
  'Hostel Block', 'Parking Area', 'Garden / Open Area', 'Other'
]

const steps = ['Item Details', 'Location & Time', 'Upload Photos', 'Review & Submit']

export default function Reportfound() {
  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState([])
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    brand: '',
    color: '',
    location: '',
    date: '',
    time: '',
    secretDetail: '',
  })

  const updateForm = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const canNext = () => {
    if (step === 0) return form.title && form.category && form.description
    if (step === 1) return form.location && form.date
    if (step === 2) return true
    return true
  }

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert("Please login first.");
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      formData.append('type', 'FOUND');
      
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      await api.post('/items/report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error reporting item');
    } finally {
      setLoading(false);
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    const urls = newFiles.map(f => URL.createObjectURL(f))
    setPhotos(prev => [...prev, ...urls].slice(0, 5))
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const handleFileInput = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    const urls = newFiles.map(f => URL.createObjectURL(f))
    setPhotos(prev => [...prev, ...urls].slice(0, 5))
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }


  return (
    <AppLayout title="Report Found Item">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step ? 'bg-accent text-white' :
                    i === step ? 'bg-primary text-white shadow-blue-200' :
                    'bg-secondary-100 text-secondary-400'
                  }`}>
                    {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-secondary-400'}`}>
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${i < step ? 'bg-accent' : 'bg-secondary-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="bg-surface rounded-3xl border border-secondary-100 shadow-md overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-secondary-100">
              <div className="flex items-center gap-2 text-error mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Report Found Item</span>
              </div>
              <h2 className="text-xl font-bold text-secondary-900">{steps[step]}</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 0 – Item Details */}
              {step === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">Item Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., MacBook Pro 14-inch Silver"
                      className="input-field"
                      value={form.title}
                      onChange={e => updateForm('title', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">Category *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => updateForm('category', cat.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
                            form.category === cat.id
                              ? 'border-primary bg-primary-50'
                              : 'border-secondary-100 hover:border-secondary-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                            <cat.icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-secondary-600">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">Brand / Make</label>
                      <input
                        type="text"
                        placeholder="e.g., Apple, Samsung"
                        className="input-field"
                        value={form.brand}
                        onChange={e => updateForm('brand', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">Color</label>
                      <input
                        type="text"
                        placeholder="e.g., Silver, Black"
                        className="input-field"
                        value={form.color}
                        onChange={e => updateForm('color', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">Description *</label>
                    <textarea
                      placeholder="Describe any unique features, stickers, damage marks, or identifying details..."
                      className="input-field resize-none"
                      rows={4}
                      value={form.description}
                      onChange={e => updateForm('description', e.target.value)}
                    />
                    <p className="text-xs text-secondary-400 mt-1">Be specific — better descriptions = better AI matches</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">
                      Secret Identification Detail
                      <span className="badge-warning ml-2 text-xs">Used for verification</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., laptop serial number, name engraved on back"
                      className="input-field"
                      value={form.secretDetail}
                      onChange={e => updateForm('secretDetail', e.target.value)}
                    />
                    <p className="text-xs text-secondary-400 mt-1">🔒 This is hidden from public view and used to verify ownership claims</p>
                  </div>
                </>
              )}

              {/* Step 1 – Location */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-secondary-900 mb-2">Last Seen Location *</label>
                    <select
                      className="input-field"
                      value={form.location}
                      onChange={e => updateForm('location', e.target.value)}
                    >
                      <option value="">Select campus location</option>
                      {campusLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Campus map placeholder */}
                  <div className="relative rounded-2xl overflow-hidden bg-secondary-100 h-48 flex items-center justify-center border border-secondary-200">
                    <div className="text-center text-secondary-400">
                      <MapPin className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm font-medium">Interactive Campus Map</p>
                      <p className="text-xs">Click to pin exact location</p>
                    </div>
                    {/* Fake map dots */}
                    {[
                      { top: '30%', left: '25%' },
                      { top: '55%', left: '60%' },
                      { top: '70%', left: '35%' },
                    ].map((pos, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-primary/60 border-2 border-primary animate-pulse"
                        style={pos}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">Date found *</label>
                      <input
                        type="date"
                        className="input-field"
                        value={form.date}
                        onChange={e => updateForm('date', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-900 mb-2">Approximate Time</label>
                      <input
                        type="time"
                        className="input-field"
                        value={form.time}
                        onChange={e => updateForm('time', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2 – Photos */}
              {step === 2 && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
                      dragging ? 'border-primary bg-primary-50' : 'border-secondary-200 hover:border-primary hover:bg-secondary-50'
                    }`}
                    onClick={() => document.getElementById('photo-input').click()}
                  >
                    <Camera className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="font-semibold text-secondary-900 mb-1">Drop photos here or click to upload</p>
                    <p className="text-sm text-secondary-400">PNG, JPG up to 10MB each · Max 5 photos</p>
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((url, i) => (
                        <div key={i} className="relative rounded-2xl overflow-hidden aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-6 h-6 bg-error rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                          {i === 0 && <span className="absolute bottom-1 left-1 badge bg-primary text-white text-xs">Primary</span>}
                        </div>
                      ))}
                      {photos.length < 5 && (
                        <button
                          onClick={() => document.getElementById('photo-input').click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-secondary-200 hover:border-primary hover:bg-primary-50 flex items-center justify-center text-secondary-400 hover:text-primary transition-all"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-secondary-400">
                    💡 <strong>Tip:</strong> Clear, well-lit photos significantly improve AI matching accuracy.
                  </p>
                </>
              )}

              {/* Step 3 – Review */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-secondary-50 rounded-2xl p-5 border border-secondary-100">
                    <div className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">Item Details</div>
                    <div className="space-y-2">
                      {[
                        ['Name', form.title || '—'],
                        ['Category', form.category || '—'],
                        ['Brand', form.brand || '—'],
                        ['Color', form.color || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-secondary-500">{k}</span>
                          <span className="font-medium text-secondary-900 capitalize">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-secondary-50 rounded-2xl p-5 border border-secondary-100">
                    <div className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">Location & Time</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary-500">Location</span>
                        <span className="font-medium text-secondary-900">{form.location || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-500">Date</span>
                        <span className="font-medium text-secondary-900">{form.date || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {photos.length > 0 && (
                    <div className="bg-secondary-50 rounded-2xl p-5 border border-secondary-100">
                      <div className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-3">Photos ({photos.length})</div>
                      <div className="flex gap-2">
                        {photos.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-primary-50 rounded-2xl p-4 border border-primary/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary-700">
                      Your report will be publicly visible. Your contact details remain private. AI matching will begin immediately after submission.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-5 border-t border-secondary-100 flex items-center justify-between">
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
                className="btn-ghost"
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <span className="text-xs text-secondary-400">Step {step + 1} of {steps.length}</span>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary bg-error hover:bg-error-dark disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Report'}
                  {!loading && <AlertCircle className="w-4 h-4" />}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
