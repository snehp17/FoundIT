import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ReportLost from './ReportLost'

// Report Found reuses the same multi-step wizard with a different header color
export default function ReportFound() {
  return (
    <AppLayout title="Report Found Item">
      <div className="max-w-2xl mx-auto">
        <div className="bg-accent/5 rounded-3xl border border-accent/20 p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🎉</span>
          </div>
          <div>
            <p className="font-semibold text-secondary-900 text-sm">Thank you for being a hero!</p>
            <p className="text-xs text-secondary-500">Reporting found items helps reunite students with their belongings. You're awesome.</p>
          </div>
        </div>

        {/* Embed the same form structure - in a real app this would be a shared component */}
        <div className="bg-surface rounded-3xl border border-secondary-100 shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Report a Found Item</h2>
          <p className="text-secondary-500 mb-6">
            Share details about the item you found so we can match it with its rightful owner using AI.
          </p>
          <p className="text-sm text-secondary-400 bg-secondary-50 rounded-2xl p-4">
            This screen uses the same multi-step form as "Report Lost" — adapted for found items with an AI "Who does this belong to?" preview after submission.
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="btn-accent mt-6"
          >
            Use Report Form →
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
