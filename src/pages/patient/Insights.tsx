import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface HbA1cPoint { survey_type: string; hba1c: number; hba1c_date: string | null }

export function Insights() {
  const [points, setPoints] = useState<HbA1cPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: surveys } = await supabase
        .from('surveys')
        .select('id, survey_type')
        .eq('uid', user.id)
        .eq('status', 'submitted')

      if (!surveys?.length) { setLoading(false); return }

      const ids = surveys.map(s => s.id)
      const { data: meas } = await supabase
        .from('measurements')
        .select('survey_id, hba1c, hba1c_date')
        .in('survey_id', ids)
        .not('hba1c', 'is', null)

      const merged = (meas ?? []).map(m => {
        const s = surveys.find(sv => sv.id === m.survey_id)
        return { survey_type: s?.survey_type ?? '', hba1c: m.hba1c, hba1c_date: m.hba1c_date }
      }).filter(m => m.hba1c_date).sort((a, b) => new Date(a.hba1c_date!).getTime() - new Date(b.hba1c_date!).getTime())

      setPoints(merged)
      setLoading(false)
    }
    load()
  }, [])

  const latest = points[points.length - 1]
  const previous = points[points.length - 2]
  const delta = latest && previous ? latest.hba1c - previous.hba1c : null

  const TYPE_LABELS: Record<string, string> = {
    baseline: 'Baseline',
    followup_3m: '3-Month',
    followup_6m: '6-Month',
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">My Insights</h2>
        <p className="text-gray-400 text-sm">Descriptive trends from your survey submissions.</p>
      </div>

      <div className="px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        These insights are descriptive summaries for your reference only. They do not constitute medical advice. Consult your healthcare provider for any health decisions.
      </div>

      {points.length === 0 ? (
        <GlassCard>
          <div className="py-8 text-center text-gray-500 text-sm">No submitted survey data yet. Complete and submit at least one survey to see insights.</div>
        </GlassCard>
      ) : (
        <>
          {/* HbA1c trend */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">HbA1c Over Time</h3>
            <div className="space-y-3">
              {points.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{TYPE_LABELS[p.survey_type] ?? p.survey_type}</p>
                    <p className="text-xs text-gray-500">{p.hba1c_date ? new Date(p.hba1c_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{p.hba1c.toFixed(1)}%</p>
                    {i > 0 && (() => {
                      const d = p.hba1c - points[i - 1].hba1c
                      return (
                        <p className={`text-xs flex items-center gap-1 justify-end ${d < 0 ? 'text-emerald-400' : d > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {d < 0 ? <TrendingDown size={12} /> : d > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                          {d > 0 ? '+' : ''}{d.toFixed(1)}%
                        </p>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {delta !== null && (
              <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${delta < 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : delta > 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                {delta < 0
                  ? `Your HbA1c has improved by ${Math.abs(delta).toFixed(1)}% since your previous measurement.`
                  : delta > 0
                  ? `Your HbA1c has increased by ${delta.toFixed(1)}% since your previous measurement. Discuss this with your doctor.`
                  : 'Your HbA1c is unchanged from your previous measurement.'}
              </div>
            )}
          </GlassCard>

          {/* Target range context */}
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-3">HbA1c Reference Ranges</h3>
            <div className="space-y-2 text-xs">
              {[
                { range: '< 5.7%', label: 'Normal (non-diabetic)', color: 'text-emerald-400' },
                { range: '5.7–6.4%', label: 'Pre-diabetes', color: 'text-amber-400' },
                { range: '6.5–7.9%', label: 'Diabetes — well managed (typical target)', color: 'text-blue-400' },
                { range: '≥ 8.0%', label: 'Diabetes — above typical target range', color: 'text-red-400' },
              ].map(r => (
                <div key={r.range} className="flex items-center gap-3">
                  <span className={`font-mono w-20 ${r.color}`}>{r.range}</span>
                  <span className="text-gray-400">{r.label}</span>
                </div>
              ))}
              <p className="text-gray-600 mt-2">Reference ranges vary by individual. Always follow the targets set by your healthcare provider.</p>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
