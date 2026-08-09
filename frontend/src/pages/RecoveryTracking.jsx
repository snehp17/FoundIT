import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import api from '../api'
import {
  CheckCircle2, Circle, QrCode, Download, Share2, MapPin, Clock,
  Shield, AlertCircle, RefreshCw, Camera, XCircle, ChevronRight,
  MessageSquare, Loader2, CheckCheck, Package, Tag, Calendar
} from 'lucide-react'

// ── Event type → display config ─────────────────────
const EVENT_CONFIG = {
  REPORT_CREATED:        { label: 'Item Reported',              desc: 'Item report submitted successfully',              done: true },
  MATCH_ACCEPTED:        { label: 'Match Accepted',             desc: 'Owner accepted the AI match',                   done: true },
  VERIFICATION_STARTED:  { label: 'Ownership Verification',     desc: 'Verifying ownership via Secure Chat',           done: true },
  VERIFIED_FOR_HANDOVER: { label: 'Ownership Verified',         desc: 'Identity and ownership confirmed ✓',           done: true },
  VERIFICATION_REJECTED: { label: 'Verification Rejected',      desc: 'Ownership could not be verified',              error: true },
  QR_GENERATED:          { label: 'Handover QR Generated',      desc: 'Secure QR code issued for campus pickup',      done: true },
  QR_SCANNED:            { label: 'QR Code Scanned',            desc: 'Finder scanned the handover QR successfully',  done: true },
  HANDOVER_CONFIRMED:    { label: 'Item Handed Over',           desc: 'Finder confirmed item was handed over',         done: true },
  RECOVERED:             { label: 'Item Recovered',             desc: 'Item returned to rightful owner 🎉',           done: true },
  CLOSED:                { label: 'Recovery Closed',            desc: 'Report archived. Recovery complete.',           done: true },
}

// Status → progress phases (for progress bar)
const STATUS_PROGRESS = {
  MATCH_FOUND: 20,
  VERIFICATION_IN_PROGRESS: 35,
  VERIFIED_FOR_HANDOVER: 55,
  HANDOVER_READY: 70,
  QR_SCANNED: 80,
  HANDOVER_CONFIRMED: 90,
  RECOVERED: 100,
  CLOSED: 100,
  VERIFICATION_REJECTED: 35
}

// QR Scanner Component (uses browser camera via html5-qrcode if available)
function QRScannerModal({ onScan, onClose, loading }) {
  const [manualToken, setManualToken] = useState('')
  const [cameraError, setCameraError] = useState(false)
  const scannerRef = useRef(null)
  const scannerInstance = useRef(null)

  useEffect(() => {
    let scanner
    const startScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')
        scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
        scanner.render(
          (decodedText) => {
            scanner.clear().catch(() => {})
            onScan(decodedText)
          },
          (err) => { /* silent scan errors */ }
        )
        scannerInstance.current = scanner
      } catch (e) {
        setCameraError(true)
      }
    }
    startScanner()
    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-secondary-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">Scan Handover QR</h3>
          </div>
          <button onClick={onClose} className="text-secondary-300 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!cameraError ? (
            <div id="qr-reader" className="rounded-2xl overflow-hidden" ref={scannerRef} />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <Camera className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-amber-700">Camera not available. Paste the QR code text manually:</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Validating QR...</span>
            </div>
          )}

          <div className="border-t border-secondary-100 pt-4">
            <p className="text-xs text-secondary-400 mb-2">Or enter the QR code value manually:</p>
            <div className="flex gap-2">
              <input
                className="input-field flex-1 py-2 text-sm"
                placeholder="FOUNDIT:..."
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
              />
              <button
                onClick={() => manualToken.trim() && onScan(manualToken.trim())}
                disabled={!manualToken.trim() || loading}
                className="btn-primary btn-sm"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// QR Display Modal (owner shows QR to finder)
function QRDisplayModal({ qrDataUrl, rawToken, expiresAt, onClose, onDownload }) {
  const expiryStr = expiresAt ? new Date(expiresAt).toLocaleString() : '48 hours'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface rounded-3xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <QrCode className="w-5 h-5" />
            <h3 className="font-semibold">Your Handover QR</h3>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="bg-white rounded-2xl p-3 inline-block shadow-md">
            <img src={qrDataUrl} alt="Handover QR Code" className="w-56 h-56" />
          </div>
          {rawToken && (
            <div className="mt-2 text-left">
              <p className="text-xs text-secondary-500 font-semibold mb-1">Manual Code (if scanning fails):</p>
              <div className="flex bg-secondary-50 border border-secondary-200 rounded-lg p-2 text-xs font-mono break-all relative">
                {rawToken}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(rawToken);
                    alert("Token copied!");
                  }} 
                  className="ml-2 text-primary hover:text-primary-focus"
                  title="Copy to clipboard"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-secondary-400">Show this to the finder at the campus office.<br />Expires: {expiryStr}</p>
          <div className="flex gap-3">
            <button onClick={onDownload} className="btn-primary btn-sm flex-1">
              <Download className="w-4 h-4" /> Download
            </button>
            {navigator.share && (
              <button
                onClick={() => navigator.share({ title: 'FoundIT Handover QR', text: rawToken ? `Handover Code: ${rawToken}` : 'Your handover QR code' })}
                className="btn-secondary btn-sm flex-1"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function RecoveryTracking() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [recovery, setRecovery] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [qrData, setQrData] = useState(null) // { qr_data_url, expires_at }
  const [showScanner, setShowScanner] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null) // revealed info after scan
  const [showQrModal, setShowQrModal] = useState(false)
  const [generatingQr, setGeneratingQr] = useState(false)

  const fetchRecovery = async () => {
    try {
      const [recRes, evtRes] = await Promise.all([
        api.get(`/recovery/${id}`),
        api.get(`/recovery/${id}/events`)
      ])
      setRecovery(recRes.data)
      setEvents(evtRes.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load recovery data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchRecovery()
  }, [id])

  // Poll every 10s for updates
  useEffect(() => {
    const interval = setInterval(fetchRecovery, 10000)
    return () => clearInterval(interval)
  }, [id])

  const progress = recovery ? (STATUS_PROGRESS[recovery.status] ?? 20) : 0

  const handleGenerateQR = async () => {
    setGeneratingQr(true)
    try {
      const res = await api.post(`/recovery/${id}/qr`)
      setQrData(res.data)
      setShowQrModal(true)
      fetchRecovery()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate QR code')
    } finally {
      setGeneratingQr(false)
    }
  }

  const handleScanQR = async (token) => {
    setScanLoading(true)
    try {
      const res = await api.post('/recovery/scan-qr', { token })
      setScanResult(res.data)
      setShowScanner(false)
      fetchRecovery()
    } catch (err) {
      const errData = err.response?.data
      // Show the error as a scan result so user sees it on screen
      setScanResult({ verified: false, message: errData?.message || 'Invalid QR code' })
      setShowScanner(false)
    } finally {
      setScanLoading(false)
    }
  }

  const handleVerify = async (status) => {
    setActionLoading(true)
    try {
      await api.post(`/recovery/${id}/verify`, { status })
      fetchRecovery()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification')
    } finally {
      setActionLoading(false)
    }
  }

  const handleHandoverConfirm = async () => {
    if (!window.confirm('Confirm that you have physically handed the item to the owner?')) return
    setActionLoading(true)
    try {
      await api.post(`/recovery/${id}/handover-confirm`)
      fetchRecovery()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm handover')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClose = async () => {
    if (!window.confirm('Confirm you have received your item? This will close the recovery and archive both reports.')) return
    setActionLoading(true)
    try {
      await api.post(`/recovery/${id}/close`)
      fetchRecovery()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close recovery')
    } finally {
      setActionLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrData?.qr_data_url) return
    const a = document.createElement('a')
    a.href = qrData.qr_data_url
    a.download = `foundit-qr-${id.substring(0, 8)}.png`
    a.click()
  }

  if (loading) return (
    <AppLayout title="Recovery Tracking">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    </AppLayout>
  )

  if (error) return (
    <AppLayout title="Recovery Tracking">
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-red-700 mb-1">Recovery Not Found</h3>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/matches')} className="btn-secondary btn-sm">
            ← Back to Matches
          </button>
        </div>
      </div>
    </AppLayout>
  )

  const isOwner = recovery?.userRole === 'owner'
  const isFinder = recovery?.userRole === 'finder'
  const status = recovery?.status

  const canVerify = false // Bypass manual chat verification step as per user request
  const canGenerateQR = isOwner && ['VERIFICATION_IN_PROGRESS', 'VERIFIED_FOR_HANDOVER', 'HANDOVER_READY'].includes(status)
  const canScanQR = isFinder && ['VERIFICATION_IN_PROGRESS', 'HANDOVER_READY', 'VERIFIED_FOR_HANDOVER'].includes(status)
  const canHandoverConfirm = isFinder && ['QR_SCANNED'].includes(status)
  const canClose = isOwner && ['HANDOVER_CONFIRMED', 'QR_SCANNED'].includes(status)

  const lostItemTitle = recovery?.lost_item?.title || 'Lost Item'
  const statusLabel = {
    MATCH_FOUND: 'Match Found',
    VERIFICATION_IN_PROGRESS: 'Verification In Progress',
    VERIFIED_FOR_HANDOVER: 'Verified — Awaiting Handover',
    HANDOVER_READY: 'Handover QR Ready',
    QR_SCANNED: 'QR Scanned',
    HANDOVER_CONFIRMED: 'Item Handed Over',
    RECOVERED: 'Item Recovered! 🎉',
    CLOSED: 'Recovery Closed ✓',
    VERIFICATION_REJECTED: 'Verification Failed',
  }[status] || status

  const badgeClass = status === 'CLOSED' || status === 'RECOVERED'
    ? 'badge-success'
    : status === 'VERIFICATION_REJECTED'
    ? 'badge-error'
    : status === 'HANDOVER_READY' || status === 'QR_SCANNED'
    ? 'badge-primary'
    : 'badge-warning'

  return (
    <AppLayout title="Recovery Tracking">
      <AnimatePresence>
        {showScanner && (
          <QRScannerModal
            onScan={handleScanQR}
            onClose={() => setShowScanner(false)}
            loading={scanLoading}
          />
        )}
        {showQrModal && qrData && (
          <QRDisplayModal
            qrDataUrl={qrData.qr_data_url}
            rawToken={qrData.raw_token}
            expiresAt={qrData.expires_at}
            onClose={() => setShowQrModal(false)}
            onDownload={downloadQR}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto space-y-5">

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-secondary-900">{lostItemTitle}</h2>
              <p className="text-secondary-500 text-sm">
                Recovery #{id?.substring(0, 8).toUpperCase()} ·
                <span className="ml-1">{isOwner ? 'You are the owner' : 'You are the finder'}</span>
              </p>
            </div>
            <span className={`badge text-sm py-2 px-4 ${badgeClass}`}>{statusLabel}</span>
          </div>

          {/* Progress bar */}
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
            <span className="font-semibold text-primary">{progress}% complete</span>
            <span>Recovered</span>
          </div>

          {/* AI Score */}
          {recovery?.match_scores?.overall_score && (
            <div className="mt-3 flex items-center gap-2 text-xs text-secondary-500">
              <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-lg">
                {recovery.match_scores.overall_score}% AI match confidence
              </span>
            </div>
          )}

          {/* Item Summary */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-500 mb-1">LOST ITEM</p>
              <p className="text-sm font-semibold text-secondary-800 truncate">{recovery?.lost_item?.title}</p>
              <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5 truncate">
                <Tag className="w-3 h-3" />{recovery?.lost_item?.category}
              </p>
              {recovery?.lost_item?.location && (
                <p className="text-xs text-secondary-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3" />{recovery?.lost_item?.location}
                </p>
              )}
            </div>
            <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
              <p className="text-xs font-semibold text-accent mb-1">FOUND ITEM</p>
              <p className="text-sm font-semibold text-secondary-800 truncate">{recovery?.found_item?.title}</p>
              <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5 truncate">
                <Tag className="w-3 h-3" />{recovery?.found_item?.category}
              </p>
              {recovery?.found_item?.location && (
                <p className="text-xs text-secondary-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3" />{recovery?.found_item?.location}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Scan Result Reveal */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/5 border border-accent/20 rounded-3xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCheck className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-accent">QR Verified — Owner Details Revealed</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-secondary-500">Owner:</span> <span className="font-semibold">{scanResult.owner?.name}</span></p>
                <p><span className="text-secondary-500">Email:</span> <span className="font-semibold">{scanResult.owner?.email}</span></p>
                <p><span className="text-secondary-500">Item:</span> <span className="font-semibold">{scanResult.item?.title}</span></p>
                {scanResult.item?.location && <p><span className="text-secondary-500">Reported at:</span> <span className="font-semibold">{scanResult.item?.location}</span></p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recovery Timeline */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-6">
          <h3 className="font-semibold text-secondary-900 mb-6">Recovery Journey</h3>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-secondary-100" />
            <div className="space-y-6">
              {events.length === 0 ? (
                <p className="text-sm text-secondary-400 pl-16">No events yet. Recovery just started.</p>
              ) : events.map((event, i) => {
                const config = EVENT_CONFIG[event.event_type] || {
                  label: event.event_type.replace(/_/g, ' '),
                  desc: 'Status updated',
                  done: true
                }
                const isLast = i === events.length - 1
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      config.error
                        ? 'bg-red-50 border-red-400'
                        : config.done
                        ? 'bg-accent border-accent'
                        : 'bg-surface border-primary'
                    }`}>
                      {config.error
                        ? <XCircle className="w-5 h-5 text-red-500" />
                        : config.done
                        ? <CheckCircle2 className="w-5 h-5 text-white" />
                        : isLast
                        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 rounded-full bg-primary" />
                        : <Circle className="w-5 h-5 text-secondary-200" />
                      }
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className={`font-semibold text-sm ${config.error ? 'text-red-600' : 'text-secondary-900'}`}>
                          {config.label}
                          {isLast && !['RECOVERED', 'CLOSED'].includes(event.event_type) && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Current</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-secondary-400">
                          <Clock className="w-3 h-3" />
                          {new Date(event.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <p className="text-sm text-secondary-500 mt-0.5">{config.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-3">
          {/* Verify Ownership */}
          {canVerify && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800">Ownership Verification</h3>
                  <p className="text-sm text-amber-600 mt-1">
                    {isOwner
                      ? 'Use Secure Chat to verify the finder\'s claim. When satisfied, mark as verified.'
                      : 'Use Secure Chat to provide ownership proof to the owner. Wait for their verification.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => navigate(`/chat?peerId=${isFinder ? recovery.owner_id : recovery.finder_id}&itemId=${recovery.lost_item_id}`)}
                  className="btn-secondary btn-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Open Secure Chat
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleVerify('VERIFIED')}
                      disabled={actionLoading}
                      className="btn-primary btn-sm"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Mark Verified
                    </button>
                    <button
                      onClick={() => handleVerify('REJECTED')}
                      disabled={actionLoading}
                      className="btn-sm !text-red-600 !border-red-200 hover:!bg-red-50 border"
                    >
                      <XCircle className="w-4 h-4" /> Reject Claim
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Owner: Generate QR */}
          {canGenerateQR && !qrData && (
            <div className="bg-primary/5 rounded-3xl border border-primary/20 p-5">
              <div className="flex items-start gap-3 mb-4">
                <QrCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-secondary-900">Generate Handover QR</h3>
                  <p className="text-sm text-secondary-500 mt-1">
                    Ownership verified! Generate a secure QR code that the finder will scan at campus pickup. Valid for 48 hours.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={generatingQr}
                className="btn-primary btn-sm"
              >
                {generatingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Generate QR Code
              </button>
            </div>
          )}

          {/* Owner: Show QR again */}
          {isOwner && qrData && !['CLOSED', 'RECOVERED'].includes(status) && (
            <div className="bg-primary/5 rounded-3xl border border-primary/20 p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-secondary-800">Your Handover QR is ready.</p>
              </div>
              <button onClick={() => setShowQrModal(true)} className="btn-primary btn-sm">
                Show QR
              </button>
            </div>
          )}

          {/* Finder: Scan QR */}
          {canScanQR && (
            <div className="bg-secondary-900 rounded-3xl p-5 text-white">
              <div className="flex items-start gap-3 mb-4">
                <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Scan Handover QR</h3>
                  <p className="text-secondary-300 text-sm mt-1">
                    The owner has generated a handover QR. Scan it at the campus office or via the scanner below to reveal pickup details.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowScanner(true)} className="btn-primary btn-sm">
                <Camera className="w-4 h-4" /> Open QR Scanner
              </button>
            </div>
          )}

          {/* Scan Verification Result */}
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-5 border ${scanResult.verified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start gap-3 mb-3">
                {scanResult.verified 
                  ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  : <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                }
                <div>
                  <h3 className={`font-bold text-lg ${scanResult.verified ? 'text-green-800' : 'text-red-800'}`}>
                    {scanResult.verified ? 'Owner Verified ✅' : 'Verification Failed ❌'}
                  </h3>
                  <p className={`text-sm mt-1 ${scanResult.verified ? 'text-green-600' : 'text-red-600'}`}>
                    {scanResult.message}
                  </p>
                </div>
              </div>
              {scanResult.verified && scanResult.owner && (
                <div className="mt-3 bg-white rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-secondary-800">Owner Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-secondary-400">Name:</span>
                      <p className="font-medium text-secondary-800">{scanResult.owner.name}</p>
                    </div>
                    <div>
                      <span className="text-secondary-400">Email:</span>
                      <p className="font-medium text-secondary-800">{scanResult.owner.email}</p>
                    </div>
                  </div>
                  {scanResult.item && (
                    <div className="mt-2 pt-2 border-t border-secondary-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-secondary-800">Item Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-secondary-400">Item:</span>
                          <p className="font-medium text-secondary-800">{scanResult.item.title}</p>
                        </div>
                        <div>
                          <span className="text-secondary-400">Category:</span>
                          <p className="font-medium text-secondary-800">{scanResult.item.category}</p>
                        </div>
                        {scanResult.item.location && (
                          <div>
                            <span className="text-secondary-400">Location:</span>
                            <p className="font-medium text-secondary-800">{scanResult.item.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ You can safely hand over the item to this person.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Finder: Confirm Handover */}
          {canHandoverConfirm && (
            <div className="bg-accent/5 rounded-3xl border border-accent/20 p-5">
              <div className="flex items-start gap-3 mb-4">
                <Package className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-secondary-900">Confirm Item Handover</h3>
                  <p className="text-sm text-secondary-500 mt-1">
                    Have you physically handed over the item to the owner? Confirm to update the recovery status.
                  </p>
                </div>
              </div>
              <button onClick={handleHandoverConfirm} disabled={actionLoading} className="btn-primary btn-sm">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Confirm Handover
              </button>
            </div>
          )}

          {/* Owner: Confirm Receipt and Close */}
          {canClose && (
            <div className="bg-accent/5 rounded-3xl border border-accent/20 p-5">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-secondary-900">Confirm Item Received</h3>
                  <p className="text-sm text-secondary-500 mt-1">
                    Have you received your item? Click below to confirm and close the recovery. Both reports will be archived.
                  </p>
                </div>
              </div>
              <button onClick={handleClose} disabled={actionLoading} className="btn-primary btn-sm">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Item Received — Close Recovery
              </button>
            </div>
          )}

          {/* Recovery Complete */}
          {['RECOVERED', 'CLOSED'].includes(status) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent/10 border border-accent/30 rounded-3xl p-6 text-center"
            >
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="font-bold text-accent text-lg mb-1">Recovery Complete!</h3>
              <p className="text-secondary-500 text-sm">The item has been successfully returned to its rightful owner.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary btn-sm mt-4">
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
