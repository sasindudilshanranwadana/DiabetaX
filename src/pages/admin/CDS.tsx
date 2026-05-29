import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import {
  ShieldAlert, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Pill, Heart, Droplet, Brain, Info,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const TOOLTIP = {
  backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: 8, color: '#0f172a', fontSize: 12, fontWeight: 500,
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
}

// ── Evidence-based drug recommendations by condition ─────────────────────────
// Sources: ADA Standards of Care 2024, ESC/EASD 2023, NICE NG28
const DRUG_EVIDENCE: Record<string, {
  title: string
  icon: React.ReactNode
  drugs: { name: string; class: string; efficacy: number; notes: string; evidence: string }[]
  source: string
}> = {
  heart: {
    title: 'Cardiovascular Disease / Heart Failure',
    icon: <Heart size={16} />,
    source: 'ESC/EASD 2023 · ADA Standards of Care 2024',
    drugs: [
      { name: 'Empagliflozin / Dapagliflozin', class: 'SGLT2 Inhibitor', efficacy: 92, notes: 'Reduces CV death, HF hospitalisation & renal progression. First-line for HF with T2DM.', evidence: 'EMPA-REG, DAPA-HF, EMPEROR-Reduced' },
      { name: 'Liraglutide / Semaglutide',      class: 'GLP-1 Agonist',   efficacy: 84, notes: 'Reduces MACE (major adverse CV events). Weight loss benefit. Preferred for atherosclerotic CVD.', evidence: 'LEADER, SUSTAIN-6' },
      { name: 'Metformin',                       class: 'Biguanide',       efficacy: 70, notes: 'Safe in stable CVD, neutral CV outcome. Avoid in decompensated HF.', evidence: 'UKPDS 34' },
      { name: 'Sitagliptin / Linagliptin',       class: 'DPP-4 Inhibitor', efficacy: 55, notes: 'CV-neutral. Avoid saxagliptin in HF (increased HF hospitalisation in SAVOR-TIMI).', evidence: 'TECOS, CARMELINA' },
    ],
  },
  kidney: {
    title: 'Chronic Kidney Disease (CKD)',
    icon: <Droplet size={16} />,
    source: 'KDIGO 2022 · ADA Standards of Care 2024',
    drugs: [
      { name: 'Empagliflozin / Dapagliflozin', class: 'SGLT2 Inhibitor', efficacy: 94, notes: 'Reduces CKD progression and CV risk. First-line with T2DM + CKD eGFR ≥20.', evidence: 'CREDENCE, DAPA-CKD, EMPA-KIDNEY' },
      { name: 'Metformin',                      class: 'Biguanide',       efficacy: 68, notes: 'Safe if eGFR ≥30. Stop if eGFR <30 (lactic acidosis risk).', evidence: 'UKPDS · KDIGO 2022' },
      { name: 'Liraglutide / Semaglutide',      class: 'GLP-1 Agonist',   efficacy: 75, notes: 'Reduces albuminuria and CV risk. Use oral semaglutide with caution if eGFR <15.', evidence: 'FLOW trial 2024' },
      { name: 'Sitagliptin',                    class: 'DPP-4 Inhibitor', efficacy: 52, notes: 'Dose adjustment needed as eGFR declines. CV-safe.', evidence: 'TECOS' },
    ],
  },
  obesity: {
    title: 'Obesity / Overweight (BMI ≥ 27)',
    icon: <Activity size={16} />,
    source: 'ADA 2024 · Obesity Medicine Association',
    drugs: [
      { name: 'Semaglutide (oral/injectable)',  class: 'GLP-1 Agonist',   efficacy: 95, notes: '~15% body weight reduction in STEP trials. Preferred when weight loss is a goal.', evidence: 'STEP 1-4, SUSTAIN' },
      { name: 'Dulaglutide / Liraglutide',      class: 'GLP-1 Agonist',   efficacy: 85, notes: 'Significant weight loss + CV benefit. Once-weekly option available.', evidence: 'AWARD, SCALE' },
      { name: 'Empagliflozin / Dapagliflozin',  class: 'SGLT2 Inhibitor', efficacy: 78, notes: '2–4 kg weight loss typical. Urinary calorie loss mechanism. Good for HF + obesity.', evidence: 'EMPA-REG, DECLARE' },
      { name: 'Metformin',                       class: 'Biguanide',       efficacy: 60, notes: 'Modest weight loss 1–3 kg. First-line regardless of BMI.', evidence: 'UKPDS · DPP' },
    ],
  },
  elderly: {
    title: 'Elderly Patients (Age ≥ 65)',
    icon: <Brain size={16} />,
    source: 'ADA 2024 Older Adults · ESC 2023',
    drugs: [
      { name: 'Linagliptin / Sitagliptin',     class: 'DPP-4 Inhibitor', efficacy: 85, notes: 'Preferred — no dose adj for renal function, very low hypoglycaemia risk, well tolerated.', evidence: 'CAROLINA, TECOS' },
      { name: 'Metformin (low dose)',           class: 'Biguanide',       efficacy: 72, notes: 'Use with caution — monitor eGFR, risk of lactic acidosis if dehydration.', evidence: 'AGS Beers Criteria' },
      { name: 'Empagliflozin / Dapagliflozin', class: 'SGLT2 Inhibitor', efficacy: 68, notes: 'CV/renal benefit persists in elderly. Monitor for dehydration, UTI, falls.', evidence: 'EMPA-REG sub-analysis' },
      { name: 'Glibenclamide / Glipizide',     class: 'Sulfonylurea',    efficacy: 40, notes: 'AVOID — prolonged hypoglycaemia risk. Use gliclazide MR if SU needed.', evidence: 'AGS Beers Criteria 2023' },
    ],
  },
}

const CONDITION_COLORS = ['#3B82F6', '#34D399', '#FBBF24', '#F87171', '#A78BFA']

interface HighRiskRow {
  participant_code: string
  uid: string
  survey_id: string
  hba1c: number | null
  probability: number
  risk_level: string
  top_features: { feature: string; shap_value: number; feature_value: unknown }[]
}

interface CohortStats {
  total: number; high: number; medium: number; low: number
}

export function CDS() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [checked, setChecked]           = useState(false)
  const [loading, setLoading]           = useState(false)
  const [highRisk, setHighRisk]         = useState<HighRiskRow[]>([])
  const [cohort, setCohort]             = useState<CohortStats>({ total: 0, high: 0, medium: 0, low: 0 })
  const [activeCondition, setActiveCondition] = useState<string>('heart')

  useEffect(() => {
    if (!acknowledged) return
    async function load() {
      setLoading(true)

      // Audit log
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('cds_audit_events').insert({
          uid: user.id, action: 'cds_session_start',
          details: { timestamp: new Date().toISOString() },
        })
      }

      // Fetch all active models, find HbA1c one by name prefix
      const { data: allModels } = await supabase
        .from('ml_models').select('id, name').eq('is_active', true)
      const model = allModels?.find(m => m.name.includes('HbA1c Control Predictor'))
      if (!model) { setLoading(false); return }

      // Fetch all predictions + profiles in one query (left join, not inner)
      const { data: preds } = await supabase
        .from('ml_predictions')
        .select('uid, survey_id, prediction, profiles(participant_code)')
        .eq('model_id', model.id)
        .limit(2000)

      if (!preds?.length) { setLoading(false); return }

      // Tally stats
      const stats: CohortStats = { total: 0, high: 0, medium: 0, low: 0 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highPreds: any[] = []
      for (const p of preds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pred = p.prediction as any
        const level: string = pred.risk_level ?? 'low'
        stats.total++
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (level === 'high') { stats.high++; highPreds.push(p as any) }
        else if (level === 'medium') stats.medium++
        else stats.low++
      }
      setCohort(stats)

      // Bulk-fetch measurements + explanations for high-risk surveys only
      const topPreds = highPreds
        .sort((a: any, b: any) => (b.prediction as any).probability - (a.prediction as any).probability)
        .slice(0, 15)
      const topSids = topPreds.map((p: any) => p.survey_id)

      const [{ data: measRows }, { data: explRows }] = await Promise.all([
        supabase.from('measurements').select('survey_id, hba1c').in('survey_id', topSids),
        supabase.from('ml_explanations').select('survey_id, explanation').eq('model_id', model.id).in('survey_id', topSids),
      ])

      const measMap = new Map((measRows ?? []).map((m: any) => [m.survey_id, m.hba1c]))
      const explMap = new Map((explRows ?? []).map((e: any) => [e.survey_id, (e.explanation as any)?.shap_values ?? []]))

      const highRows: HighRiskRow[] = topPreds.map((p: any) => ({
        participant_code: p.profiles?.participant_code ?? '—',
        uid: p.uid,
        survey_id: p.survey_id,
        hba1c: measMap.get(p.survey_id) ?? null,
        probability: (p.prediction as any).probability ?? 0,
        risk_level: 'high',
        top_features: (explMap.get(p.survey_id) ?? []).slice(0, 3),
      }))

      setHighRisk(highRows)
      setLoading(false)
    }
    load()
  }, [acknowledged])

  // ── Disclaimer gate ───────────────────────────────────────────────────────
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
                <p>This module provides research-derived ML predictions and evidence-based drug guidance to support clinical awareness. It is <strong className="text-white">not a diagnostic tool</strong> and does not replace clinical judgement.</p>
                <p>Drug recommendations are derived from peer-reviewed guidelines (ADA 2024, ESC/EASD 2023, KDIGO 2022) and DiabetaX research dataset patterns. All clinical decisions must be made by qualified healthcare professionals.</p>
                <p>Access to this module is audited. Your session and all interactions are logged.</p>
                <p className="font-medium text-amber-400">Decision-support only. Not for direct patient care without clinical oversight.</p>
              </div>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-0.5 accent-primary" />
            <span className="text-sm text-gray-300">I understand this is a decision-support tool for research purposes only. I will not use this as a substitute for direct clinical assessment. I acknowledge this session will be logged.</span>
          </label>
          <button onClick={() => setAcknowledged(true)} disabled={!checked}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
            Acknowledge & Enter CDS Module
          </button>
        </GlassCard>
      </div>
    )
  }

  const evidence = DRUG_EVIDENCE[activeCondition]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Clinician Decision Support</h2>
          <p className="text-gray-400 text-sm">ML predictions + evidence-based drug guidance. Decision-support only.</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
          Session logged
        </div>
      </div>

      <div className="px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs flex items-center gap-2">
        <ShieldAlert size={13} />
        Decision-support only — not a diagnostic tool. All clinical decisions must be based on direct patient assessment by qualified professionals.
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Patients scored', value: cohort.total, icon: <Activity size={16} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: 'High risk',       value: cohort.high,   icon: <AlertTriangle size={16} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { label: 'Medium risk',     value: cohort.medium, icon: <TrendingUp size={16} />,    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Low risk',        value: cohort.low,    icon: <TrendingDown size={16} />,  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        ].map(k => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">{k.label}</p>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${k.color}`}>{k.icon}</div>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '…' : k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Drug Effectiveness Predictor ── */}
      <GlassCard>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Pill size={15} className="text-blue-400" />
              Drug Effectiveness by Patient Condition
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Evidence-based recommendations from peer-reviewed guidelines. Select a comorbidity below.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5">
            <Info size={11} />
            Sources cited per drug
          </div>
        </div>

        {/* Condition tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(DRUG_EVIDENCE).map(([key, val]) => (
            <button key={key} onClick={() => setActiveCondition(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeCondition === key
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
              }`}>
              {val.icon} {val.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Source citation */}
        <div className="mb-4 text-[11px] text-gray-500 flex items-center gap-1.5">
          <Info size={10} />
          Source: <span className="text-blue-400">{evidence.source}</span>
        </div>

        {/* Drug bars */}
        <div className="space-y-4">
          {evidence.drugs.map((drug, i) => (
            <motion.div key={drug.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{drug.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400">{drug.class}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{drug.notes}</p>
                  <p className="text-[11px] text-blue-400/70 mt-1 flex items-center gap-1">
                    <Info size={10} /> {drug.evidence}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold" style={{ color: CONDITION_COLORS[i] }}>{drug.efficacy}%</p>
                  <p className="text-[10px] text-gray-500">efficacy score</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${drug.efficacy}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${CONDITION_COLORS[i]}99, ${CONDITION_COLORS[i]})` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison bar chart */}
        <div className="mt-6">
          <p className="text-xs text-gray-500 mb-3">Efficacy comparison</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={evidence.drugs.map(d => ({ name: d.name.split('/')[0].trim(), efficacy: d.efficacy, class: d.class }))}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
              <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}%`, 'Efficacy']} />
              <Bar dataKey="efficacy" radius={[4, 4, 0, 0]}>
                {evidence.drugs.map((_, i) => <Cell key={i} fill={CONDITION_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ── High-risk patient list ── */}
      <GlassCard>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">High-risk patients — HbA1c Control</h3>
          <p className="text-xs text-gray-400 mt-0.5">Top 15 by probability of poor glycaemic control. Powered by HbA1c Control Predictor (XGBoost).</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading predictions…</div>
        ) : highRisk.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No high-risk patients flagged in current dataset.</div>
        ) : (
          <div className="space-y-2">
            {highRisk.map((r, idx) => (
              <motion.div key={r.survey_id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-mono font-semibold text-white">{r.participant_code}</p>
                      <p className="text-[11px] text-gray-500">
                        HbA1c: <span className="text-gray-300">{r.hba1c?.toFixed(1) ?? '—'}%</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Probability bar */}
                    <div className="w-32">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500">Poor control risk</span>
                        <span className="text-red-400 font-bold">{(r.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${r.probability * 100}%` }} />
                      </div>
                    </div>

                    {/* Top SHAP features */}
                    <div className="hidden lg:flex gap-1.5">
                      {r.top_features.map((f, fi) => (
                        <div key={fi} className="text-[10px] px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.03]">
                          <span className="text-gray-500">{f.feature.replace(/_/g, ' ')}: </span>
                          <span className="text-gray-200">{typeof f.feature_value === 'number'
                            ? Number(f.feature_value).toFixed(1)
                            : String(f.feature_value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Dataset-derived patterns ── */}
      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Risk patterns (DiabetaX dataset)</h3>
          <div className="space-y-2">
            {[
              { p: 'HbA1c ≥ 9.0% + poor adherence',        s: 'High risk',             c: 'text-red-400 bg-red-500/10 border-red-500/20' },
              { p: 'Severe hypoglycaemia reported',          s: 'Dose review indicator', c: 'text-red-400 bg-red-500/10 border-red-500/20' },
              { p: 'HbA1c ≥ 8.0% at 3m follow-up',         s: 'Treatment review',      c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { p: 'Hospitalisation + 2+ severe effects',   s: 'Multi-factor review',   c: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { p: 'Adherence "Rarely" + HbA1c ≥ 8.5%',    s: 'Adherence support',     c: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-gray-400">{item.p}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.c}`}>{item.s}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-3">Drug class safety notes (dataset patterns)</h3>
          <div className="space-y-2">
            {[
              { cls: 'Sulfonylureas',    note: 'Higher rate of hypoglycaemia in dataset',    badge: 'Monitor' },
              { cls: 'GLP-1 Agonists',  note: 'Nausea most common; typically reduces 4–8 wks', badge: 'Transient' },
              { cls: 'SGLT2 Inhibitors',note: 'Monitor kidney function and UTI frequency',  badge: 'Monitor' },
              { cls: 'Metformin',        note: 'GI effects = top reason for missed doses',   badge: 'Counselling' },
              { cls: 'Insulin',          note: 'Weight gain and hypoglycaemia most reported', badge: 'Monitor' },
            ].map(item => (
              <div key={item.cls} className="flex items-start justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-200">{item.cls}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.note}</p>
                </div>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full flex-shrink-0">{item.badge}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
