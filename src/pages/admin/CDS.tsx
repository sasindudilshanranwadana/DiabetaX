import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { ShieldAlert } from 'lucide-react'

export function CDS() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function logAccess() {
      if (!acknowledged) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('cds_audit_events').insert({
        uid: user.id,
        action: 'cds_session_start',
        details: { timestamp: new Date().toISOString() },
      })
    }
    logAccess()
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
                <p>This module provides research-derived analytics to support clinical awareness. It is <strong className="text-white">not a diagnostic tool</strong> and does not replace clinical judgement.</p>
                <p>Information presented here is based on aggregated research data and statistical patterns. All clinical decisions must be made by qualified healthcare professionals based on direct patient assessment.</p>
                <p>Access to this module is audited. Your session start time and all interactions are logged to the audit trail.</p>
                <p className="font-medium text-amber-400">Decision-support only. Not for direct patient care without clinical oversight.</p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-gray-300">
              I understand this is a decision-support tool for research purposes only. I will not use this information as a substitute for direct clinical assessment. I acknowledge this session will be logged.
            </span>
          </label>

          <button
            onClick={() => setAcknowledged(true)}
            disabled={!checked}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors"
          >
            Acknowledge & Enter CDS Module
          </button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Clinician Decision Support</h2>
          <p className="text-gray-400 text-sm">Research-derived analytics. Decision-support only.</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
          Session logged
        </div>
      </div>

      <div className="px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        Decision-support only — not a diagnostic tool. Clinical decisions must be based on direct patient assessment by qualified professionals.
      </div>

      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">High-Risk Patterns (Research Data)</h3>
          <p className="text-xs text-gray-400 mb-4">Patterns from the research dataset that may warrant clinical attention.</p>
          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span>HbA1c ≥ 8.0% at 3-month follow-up</span>
              <span className="text-red-400 font-medium">Poor glycaemic control</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span>Severe hypoglycaemia reported</span>
              <span className="text-red-400 font-medium">Dose review indicator</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span>Poor adherence + HbA1c ≥ 9.0%</span>
              <span className="text-amber-400 font-medium">Adherence intervention</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Hospitalisation + 2+ severe effects</span>
              <span className="text-amber-400 font-medium">Treatment review</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Drug Class Safety Notes (Research)</h3>
          <p className="text-xs text-gray-400 mb-4">Patterns observed in research dataset — not clinical guidelines.</p>
          <div className="space-y-2 text-xs text-gray-400">
            {[
              { cls: 'Sulfonylureas', note: 'Higher rate of hypoglycaemia side effects in dataset' },
              { cls: 'GLP-1 Agonists', note: 'Nausea most common initial effect; reduces at 4–8 weeks' },
              { cls: 'SGLT2 Inhibitors', note: 'Monitor kidney function indicators in records' },
              { cls: 'Metformin', note: 'GI effects most common reason for missed doses' },
              { cls: 'Insulin', note: 'Weight gain and hypoglycaemia most reported effects' },
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
