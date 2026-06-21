import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react'

const questions = [
  'What is the approximate storage capacity of the laptop (e.g., 256GB, 512GB, 1TB)?',
  'Describe any unique stickers, marks, or engravings on the item.',
  'What was inside the laptop bag when it was lost (if applicable)?',
]

export default function ClaimVerification() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(['', '', ''])
  const [proof, setProof] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = () => setSubmitted(true)

  if (submitted) {
    return (
      <AppLayout title="Claim Verification">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </motion.div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">Verification Submitted!</h2>
            <p className="text-secondary-500 mb-8">Your answers have been sent to the moderator for review. You'll be notified within 24 hours.</p>
            <button onClick={() => navigate('/tracking/1')} className="btn-primary w-full justify-center">
              Track Recovery Status
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Claim Verification">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Prove Ownership</h2>
              <p className="text-secondary-500 text-sm mt-1">
                To claim <strong>MacBook Pro 14" Silver</strong>, answer these questions that only the real owner would know.
                Your answers are reviewed by a campus moderator.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-warning/5 rounded-2xl border border-warning/20 p-4 flex gap-3">
          <Lock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            These questions are based on details only the owner would know. Fraudulent claims are logged and reported to campus authorities.
          </p>
        </div>

        {/* Questions */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6 space-y-5">
          <h3 className="font-semibold text-secondary-900">Verification Questions</h3>
          {questions.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-secondary-900 mb-2">
                <span className="inline-flex w-6 h-6 rounded-full bg-primary text-white text-xs items-center justify-center mr-2">{i + 1}</span>
                {q}
              </label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Your answer..."
                value={answers[i]}
                onChange={e => {
                  const a = [...answers]; a[i] = e.target.value; setAnswers(a)
                }}
              />
            </div>
          ))}
        </div>

        {/* Proof upload */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Upload Ownership Proof (Optional)</h3>
          <div
            className="border-2 border-dashed border-secondary-200 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary-50/50 transition-all cursor-pointer"
            onClick={() => document.getElementById('proof-input').click()}
          >
            <Upload className="w-10 h-10 text-secondary-300 mx-auto mb-2" />
            <p className="text-sm text-secondary-500">Upload purchase receipt, warranty card, or any proof of ownership</p>
            <input id="proof-input" type="file" className="hidden" onChange={e => setProof(e.target.files[0]?.name)} />
          </div>
          {proof && (
            <div className="mt-3 flex items-center gap-2 text-sm text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <span>{proof} uploaded</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={answers.some(a => !a.trim())}
          className="btn-primary w-full justify-center py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-5 h-5" />
          Submit Claim for Verification
        </button>
      </div>
    </AppLayout>
  )
}
