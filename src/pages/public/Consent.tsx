import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { defaultRouteForRole } from '../../lib/auth-routing'
import type { Role } from '../../types/database'
import { GridBackground } from '../../components/ui/effects/grid-bg'
import { GlowingBorder } from '../../components/ui/effects/glowing-border'
import { Button } from '../../components/ui/primitives/button'
import { Checkbox } from '../../components/ui/primitives/checkbox'
import { Logo } from '../../components/ui/Logo'
import { Badge } from '../../components/ui/primitives/badge'
import { toast } from '../../components/ui/primitives/toaster'

const CONSENT_VERSION = '1.0'

export function Consent() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('consents').upsert(
      { uid: user.id, consent_version: CONSENT_VERSION, consented: true, consented_at: new Date().toISOString() },
      { onConflict: 'uid' }
    )
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('uid', user.id).maybeSingle()
    toast.success('Welcome to DiabetaX')
    navigate(defaultRouteForRole((profile?.role as Role | undefined) ?? 'patient'), { replace: true })
  }

  return (
    <GridBackground className="flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="flex justify-center mb-8"><Logo size="lg" linkTo="/" /></div>

        <GlowingBorder>
          <div className="p-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Informed Consent</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Version {CONSENT_VERSION}</Badge>
                  <span className="text-xs text-muted-foreground">Required to continue</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-3 max-h-80 overflow-y-auto pr-2 mb-6 leading-relaxed">
              <p><strong className="text-white">Study Title:</strong> Evaluate the effectiveness of commonly used anti-diabetic drugs with their long-term side effects.</p>
              <p><strong className="text-white">Principal Investigator:</strong> R M D L Sarathchandra (Student ID 30068). <strong className="text-white">Supervisor:</strong> Dr. Damayanthi Dahanayake.</p>
              <p><strong className="text-white">Purpose:</strong> Build a dataset to improve understanding of diabetes treatment outcomes, particularly for South Asian patients.</p>
              <p><strong className="text-white">What you'll do:</strong> Complete a baseline survey (~15–20 min) about your medications, plus optional follow-ups at 3 and 6 months.</p>
              <p><strong className="text-white">Confidentiality:</strong> All data is encrypted. You're identified only by a participant code — your name is never stored. Researchers see only de-identified data.</p>
              <p><strong className="text-white">Voluntary:</strong> Participation is completely voluntary. You can withdraw at any time without consequence.</p>
              <p><strong className="text-white">Not medical advice:</strong> This platform is for research only. Always consult your healthcare provider for medical decisions.</p>
              <p><strong className="text-white">Data use:</strong> Anonymised data may be used in academic publications. No personally identifiable information will be published.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-lg bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
              <Checkbox checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
              <span className="text-sm text-foreground">
                I have read and understood the above. I voluntarily agree to participate in this research study and understand I can withdraw at any time.
              </span>
            </label>

            <Button onClick={handleAccept} disabled={!agreed || loading} variant="glow" size="lg" className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Recording consent…</> : 'I consent — continue'}
            </Button>
          </div>
        </GlowingBorder>
      </motion.div>
    </GridBackground>
  )
}
