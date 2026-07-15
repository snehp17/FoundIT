import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { CheckCircle2, Circle, QrCode, Download, Share2, MapPin, Clock } from 'lucide-react'

const stages = [
  { label: 'User Reports Lost Item', time: 'Jun 19, 2:35 PM', done: true, desc: 'Lost item report submitted successfully' },
  { label: 'Item Verified', time: 'Jun 19, 2:35 PM', done: true, desc: 'Report verified by system' },
  { label: 'AI Categorization', time: 'Jun 19, 2:36 PM', done: true, desc: 'Item categorized via GPT-4' },
  { label: 'AI Matching Started', time: 'Jun 19, 2:36 PM', done: true, desc: 'Scanning for vector embeddings matches' },
  { label: 'Potential Match Found', time: 'Jun 19, 4:52 PM', done: true, desc: 'High confidence match found' },
  { label: 'Ownership Verification', time: 'Jun 19, 6:15 PM', done: true, desc: 'Claim approved by campus moderator' },
  { label: 'Secure Handover', time: 'Jun 20, 10:00 AM', done: false, desc: 'Visit campus lost & found office with QR code', current: true },
  { label: 'Recovered', time: '—', done: false, desc: 'Item officially returned to owner' },
]

export default function RecoveryTracking() {
  const currentStage = stages.findIndex(s => s.current)
  const progress = (stages.filter(s => s.done).length / stages.length) * 100

  return (
    <AppLayout title="Recovery Tracking">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-secondary-900">MacBook Pro 14" Silver</h2>
              <p className="text-secondary-500 text-sm">Report #RPT-2025-001847</p>
            </div>
            <span className="badge badge-warning text-sm py-2 px-4">Pending Handover</span>
          </div>
          <div className="progress-bar mb-2">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2 }}
            />
          </div>
          <div className="flex justify-between text-xs text-secondary-400">
            <span>Reported</span>
            <span className="font-semibold text-primary">{Math.round(progress)}% complete</span>
            <span>Recovered</span>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <h3 className="font-semibold text-secondary-900 mb-6">Recovery Journey</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-secondary-100" />

            <div className="space-y-6">
              {stages.map((stage, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 relative"
                >
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    stage.done
                      ? 'bg-accent border-accent'
                      : stage.current
                      ? 'bg-surface border-primary shadow-blue-200'
                      : 'bg-surface border-secondary-200'
                  }`}>
                    {stage.done
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : stage.current
                      ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 rounded-full bg-primary" />
                      : <Circle className="w-5 h-5 text-secondary-200" />
                    }
                  </div>
                  <div className={`flex-1 pb-2 ${!stage.done && !stage.current ? 'opacity-40' : ''}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className={`font-semibold text-sm ${stage.current ? 'text-primary' : stage.done ? 'text-secondary-900' : 'text-secondary-400'}`}>
                        {stage.label}
                        {stage.current && <span className="ml-2 badge-primary text-xs">Current Step</span>}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-secondary-400">
                        <Clock className="w-3 h-3" />
                        {stage.time}
                      </div>
                    </div>
                    <p className="text-sm text-secondary-500 mt-0.5">{stage.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-surface rounded-2xl p-4 shadow-md flex-shrink-0">
            <div className="w-32 h-32 bg-secondary-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-16 h-16 text-secondary-400" />
            </div>
            <p className="text-xs text-center text-secondary-400 mt-2">Campus Pickup QR</p>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-secondary-900 mb-2">Ready for Campus Pickup</h3>
            <p className="text-secondary-500 text-sm mb-4">
              Show this QR code at the campus lost & found office to collect your item. The QR expires in 48 hours.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary-500 mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              Admin Block, Room 102 · Mon–Fri, 9 AM – 5 PM
            </div>
            <div className="flex gap-3">
              <button className="btn-primary btn-sm">
                <Download className="w-4 h-4" />
                Download QR
              </button>
              <button className="btn-secondary btn-sm">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
