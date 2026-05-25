import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { ShieldAlert, TrendingUp, AlertTriangle, Activity } from 'lucide-react'

interface HighRiskRow {
  participant_code: string
  uid: string
  survey_id: string
  hba1c: number | null
  probability: number
  risk_class: string
  predicted_hba1c_6m: number | null
  confidence: number
  drivers: string
}

export function CDS() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highRisk, setHighRisk] = useState<HighRiskRow[]>([])
  const [stats, setStats] = useState({ total: 0, high: 0, moderate: 0, low: 0 })

  useEffect(() => {
    if (!acknowledged) return

    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('cds_audit_events').insert({
          uid: user.id, action: 'cds_session_start',
          details: { timestamp: new Date().toISOString() },
        })
      }

      const { data: model } = await supabase
        .from('ml_models').select('id').eq('name', 'HbA1c Control Predictor').eq('is_active', true).maybeSingle()

      if (!model) { setLoading(false); return }

      const { data: preds } = await supabase
        .from('ml_predictions')
        .select('uid, survey_id, prediction, profiles!inner(participant_code), surveys!inner(id)')
        .eq('model_id', model.id)
        .order('created_at', { ascending: false })

      const enriched: HighRiskRow[] = []
      const counts = { total: 0, high: 0, moderate: 0, low: 0 }

      for (const p of preds ?? []) {
        const pred = (p as { prediction: { probability?: number; risk_class?: string; predicted_hba1c_6m?: number; confidence?: number } }).prediction
        const cls = pred.risk_class ?? 'low'
        counts.total++
        if (cls === 'high') counts.high++
        else if (cls === 'moderate') counts.moderate++
        else counts.low++

        if (cls === 'high') {
          const { data: m } = await supabase.from('measurements').select('hba1c').eq('survey_id', (p as { survey_id: string }).survey_id).maybeSingle()
          const { data: expl } = await supabase.from('ml_explanations').select('explanation').eq('survey_id', (p as { survey_id: string }).survey_id).eq('model_id', model.id).maybeSingle()
          const features = ((expl?.explanation as { top_features?: { feature: string }[] })?.top_features ?? []).slice(0, 3).map(f => f.feature).join(', ')

          enriched.push({
            participant_code: (p as { profiles: { participant_code: string } }).profiles.participant_code,
            uid: (p as { uid: string }).uid,
            survey_id: (p as { survey_id: string }).survey_id,
            hba1c: m?.hba1c ?? null,
            probability: pred.probability ?? 0,
            risk_class: cls,
            predicted_hba1c_6m: pred.predicted_hba1c_6m ?? null,
            confidence: pred.confidence ?? 0,
            drivers: features,
          })
        }
      }

      enriched.sort((a, b) => b.probability - a.probability)
      setHighRisk(enriched.slice(0, 15))
      setStats(counts)
      setLoading(false)
    }
    load()
  }, [acknowledged])

  if (!acknowledged) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Clinician Decision Support</h2>
          <p className="text-gray-400 text-sm">Restricted access — clinician_admin role required.</p>
        </div>

        <GlassCard>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Important Disclaimer</h3>
              <div className="text-sm text-gray-400 space-y-3">
                <p>This module provides research-derived ML predictions to support clinical awareness. It is <strong className="text-white">not a diagnostic tool</strong> and does not replace clinical judgement.</p>
                <p>Predictions and explanations are based on the DiabetaX research dataset and statistical models. All clinical decisions must be made by qualified healthcare professionals based on direct patient assessment.</p>
                <p>Access to this module is audited. Your session start time and all interactions are logged to <code className="text-gray-300">cds_audit_events</code>.</p>
                <p className="font-medium text-amber-400">Decision-support only. Not for direct patient care without clinical oversight.</p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 accent-primary" />
            <span className="text-sm text-gray-300">
              I understand this is a decision-support tool for research purposes only. I will not use this information as a substitute for direct clinical assessment. I acknowledge this session will be logged.
            </span>
          </label>

          <button onClick={() => setAcknowledged(true)} disabled={!checked}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
            Acknowledge & Enter CDS Module
          </button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Clinician Decision Support</h2>
          <p className="text-gray-400 text-sm">Research-derived ML predictions. Decision-support only.</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
          Session logged
        </div>
      </div>

      <div className="px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        Decision-support only — not a diagnostic tool. Clinical decisions must be based on direct patient assessment by qualified professionals.
      </div>

      {/* Risk distribution KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={20} />
            <div>
              <p className="text-xs text-gray-400">Patients scored</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">High risk</p>
              <p className="text-xl font-bold text-red-400">{stats.high}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <TrendingUp className="text-amber-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Moderate risk</p>
              <p className="text-xl font-bold text-amber-400">{stats.moderate}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-400" size={20} />
            <div>
              <p className="text-xs text-gray-400">Low risk</p>
              <p className="text-xl font-bold text-emerald-400">{stats.low}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* High-risk patient list with predictions */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-1">High-risk patients (top 15)</h3>
        <p className="text-xs text-gray-400 mb-4">From HbA1c Control Predictor v1.0 — ordered by predicted probability of being uncontrolled at 6-month follow-up.</p>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading predictions…</div>
        ) : highRisk.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No high-risk patients flagged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-2 px-2">Participant</th>
                  <th className="text-left py-2 px-2">Current HbA1c</th>
                  <th className="text-left py-2 px-2">Probability</th>
                  <th className="text-left py-2 px-2">Predicted 6m HbA1c</th>
                  <th className="text-left py-2 px-2">Confidence</th>
                  <th className="text-left py-2 px-2">Top drivers</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.map(r => (
                  <tr key={r.survey_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 px-2 font-mono text-gray-200">{r.participant_code}</td>
                    <td className="py-2 px-2 text-gray-300">{r.hba1c?.toFixed(1) ?? '—'}%</td>
                    <td className="py-2 px-2">
                      <span className="text-red-400 font-medium">{(r.probability * 100).toFixed(0)}%</span>
                    </td>
                    <td className="py-2 px-2 text-gray-300">{r.predicted_hba1c_6m?.toFixed(1) ?? '—'}%</td>
                    <td className="py-2 px-2 text-gray-400">{(r.confidence * 100).toFixed(0)}%</td>
                    <td className="py-2 px-2 text-gray-500 text-[11px]">{r.drivers || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Drug class safety notes */}
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Risk patterns (research data)</h3>
          <p className="text-xs text-gray-400 mb-4">Patterns from the research dataset that may warrant clinical attention.</p>
          <div className="space-y-3 text-xs text-gray-400">
            {[
              { p: 'HbA1c ≥ 9.0% + poor adherence', s: 'High risk', c: 'text-red-400' },
              { p: 'Severe hypoglycaemia reported', s: 'Dose review indicator', c: 'text-red-400' },
              { p: 'HbA1c ≥ 8.0% at 3m follow-up', s: 'Treatment review', c: 'text-amber-400' },
              { p: 'Hospitalisation + 2+ severe effects', s: 'Multi-factor review', c: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span>{item.p}</span>
                <span className={`${item.c} font-medium`}>{item.s}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Drug class safety notes (research)</h3>
          <p className="text-xs text-gray-400 mb-4">Patterns observed in dataset — not clinical guidelines.</p>
          <div className="space-y-2 text-xs text-gray-400">
            {[
              { cls: 'Sulfonylureas', note: 'Higher rate of hypoglycaemia in dataset' },
              { cls: 'GLP-1 Agonists', note: 'Nausea most common; reduces at 4–8 weeks' },
              { cls: 'SGLT2 Inhibitors', note: 'Monitor kidney function and UTI' },
              { cls: 'Metformin', note: 'GI effects = top reason for missed doses' },
              { cls: 'Insulin', note: 'Weight gain and hypoglycaemia most reported' },
            ].map(item => (
              <div key={item.cls} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-gray-200 font-medium">{item.cls}</p>
                <p className="text-gray-500 mt-0.5">{item.note}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
