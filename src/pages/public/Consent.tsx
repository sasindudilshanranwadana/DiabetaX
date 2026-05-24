import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const CONSENT_VERSION = '1.0'

export function Consent() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase.from('consents').upsert({
      uid: user.id,
      consent_version: CONSENT_VERSION,
      consented: true,
      consented_at: new Date().toISOString(),
    }, { onConflict: 'uid' })

    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/patient/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-200 via-surface-200 to-surface-300 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">DiabetaX</h1>
          <p className="text-gray-400 mt-2 text-sm">Informed Consent — Version {CONSENT_VERSION}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Research Participation Consent</h2>

          <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4 max-h-96 overflow-y-auto pr-2 mb-6 text-sm leading-relaxed">
            <p><strong className="text-white">Study Title:</strong> Evaluate the effectiveness of commonly used anti-diabetic drugs with their long-term side effects.</p>
            <p><strong className="text-white">Principal Investigator:</strong> R M D L Sarathchandra (Student ID: 30068)<br /><strong className="text-white">Supervisor:</strong> Dr. Damayanthi Dahanayake</p>

            <p><strong className="text-white">Purpose:</strong> This research aims to evaluate the effectiveness and long-term side effects of anti-diabetic medications. Your participation helps build a dataset to improve understanding of diabetes treatment outcomes, particularly for South Asian patients.</p>

            <p><strong className="text-white">What you will do:</strong> Complete a baseline survey about your diabetes treatment and medications, and optional follow-up surveys at 3 and 6 months. The surveys take approximately 15–20 minutes.</p>

            <p><strong className="text-white">Confidentiality:</strong> Your data is stored securely using industry-standard encryption. You are identified only by a participant code — your name is never stored. Researchers access only de-identified data.</p>

            <p><strong className="text-white">Voluntary participation:</strong> Participation is completely voluntary. You may withdraw at any time without consequence. Withdrawing will not affect your medical care.</p>

            <p><strong className="text-white">Medical disclaimer:</strong> This platform is for research purposes only. No information provided through this platform constitutes medical advice. Always consult your healthcare provider for medical decisions.</p>

            <p><strong className="text-white">Data use:</strong> Anonymised data may be used in academic publications and shared with the research supervisor. No personally identifiable information will be published.</p>

            <p><strong className="text-white">Contact:</strong> If you have questions about this research, contact the supervisor Dr. Damayanthi Dahanayake through the institution.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
            />
            <span className="text-sm text-gray-300">
              I have read and understood the above information. I voluntarily agree to participate in this research study. I understand I can withdraw at any time.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
          >
            {loading ? 'Recording consent…' : 'I consent — continue to platform'}
          </button>
        </div>
      </div>
    </div>
  )
}
