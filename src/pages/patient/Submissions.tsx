import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { CheckCircle, Clock, FileText } from 'lucide-react'

interface Survey {
  id: string
  survey_type: string
  status: string
  submitted_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  baseline: 'Baseline Survey',
  followup_3m: '3-Month Follow-up',
  followup_6m: '6-Month Follow-up',
}

export function Submissions() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('surveys')
        .select('id, survey_type, status, submitted_at, created_at')
        .eq('uid', user.id)
        .order('created_at', { ascending: false })
      setSurveys(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">My Submissions</h2>
        <p className="text-gray-400 text-sm">Survey history for your research participation.</p>
      </div>

      {surveys.length === 0 ? (
        <GlassCard>
          <div className="py-8 text-center">
            <FileText size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No surveys yet. Complete your baseline survey to get started.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => (
            <GlassCard key={s.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {s.status === 'submitted' ? <CheckCircle size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{TYPE_LABELS[s.survey_type] ?? s.survey_type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.status === 'submitted'
                        ? `Submitted ${new Date(s.submitted_at!).toLocaleDateString()}`
                        : `Started ${new Date(s.created_at).toLocaleDateString()} — draft`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  s.status === 'submitted'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {s.status === 'submitted' ? 'Submitted' : 'Draft'}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
