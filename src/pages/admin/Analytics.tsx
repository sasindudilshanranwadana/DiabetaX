import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const COLORS  = ['#3B82F6', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#2DD4BF']
const SEV_COLORS = { mild: '#34D399', moderate: '#FBBF24', severe: '#F87171' }
const TOOLTIP = { backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function Analytics() {
  const [hba1cBuckets,   setHba1cBuckets]   = useState<{ range: string; count: number }[]>([])
  const [medClasses,     setMedClasses]     = useState<{ name: string; value: number }[]>([])
  const [topSideEffects, setTopSideEffects] = useState<{ name: string; count: number }[]>([])
  const [adherence,      setAdherence]      = useState<{ name: string; value: number }[]>([])
  const [sevSplit,       setSevSplit]        = useState<{ name: string; mild: number; moderate: number; severe: number }[]>([])
  const [diabetesTypes,  setDiabetesTypes]  = useState<{ name: string; value: number }[]>([])
  const [satisfaction,   setSatisfaction]   = useState<{ score: string; count: number }[]>([])
  const [glycControl,    setGlycControl]    = useState<{ name: string; value: number }[]>([])
  const [lifestyle,      setLifestyle]      = useState<{ category: string; positive: number; total: number }[]>([])
  const [seByClass,      setSeByClass]      = useState<{ drug_class: string; short_term: number; long_term: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { data: meas },
        { data: meds },
        { data: se },
        { data: ls },
        { data: qol },
        { data: patients },
        { data: medWithClass },
      ] = await Promise.all([
        supabase.from('measurements').select('hba1c, fasting_glucose').not('hba1c', 'is', null),
        supabase.from('patient_medications').select('medication_id, medications(drug_class)'),
        supabase.from('side_effects').select('effect_name, severity, effect_type, survey_id, patient_medications(medication_id, medications(drug_class))').limit(2000),
        supabase.from('lifestyle').select('adherence_level, diet_quality, physical_activity, smoking, alcohol'),
        supabase.from('quality_of_life').select('treatment_satisfaction, qol_change'),
        supabase.from('patients').select('diabetes_type'),
        supabase.from('patient_medications').select('survey_id, medications(drug_class), side_effects(effect_type, severity)').limit(2000),
      ])

      // ── HbA1c buckets ─────────────────────────────────────────────────────
      const buckets: Record<string, number> = { '<6': 0, '6–7': 0, '7–8': 0, '8–9': 0, '9–10': 0, '≥10': 0 }
      for (const m of meas ?? []) {
        const v = m.hba1c
        if (v == null) continue
        if (v < 6) buckets['<6']++
        else if (v < 7) buckets['6–7']++
        else if (v < 8) buckets['7–8']++
        else if (v < 9) buckets['8–9']++
        else if (v < 10) buckets['9–10']++
        else buckets['≥10']++
      }
      setHba1cBuckets(Object.entries(buckets).map(([range, count]) => ({ range, count })))

      // ── Glycaemic control ─────────────────────────────────────────────────
      let poor = 0, controlled = 0
      for (const m of meas ?? []) {
        if ((m.hba1c != null && m.hba1c >= 7.5) || (m.fasting_glucose != null && m.fasting_glucose >= 180)) poor++
        else controlled++
      }
      setGlycControl([
        { name: 'Poor control (HbA1c≥7.5 or FBS≥180)', value: poor },
        { name: 'Controlled', value: controlled },
      ])

      // ── Medication class pie ───────────────────────────────────────────────
      const classCounts: Record<string, number> = {}
      for (const m of meds ?? []) {
        const cls = (m as { medications?: { drug_class?: string } | null }).medications?.drug_class ?? 'Unknown'
        classCounts[cls] = (classCounts[cls] ?? 0) + 1
      }
      setMedClasses(Object.entries(classCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

      // ── Top side effects ───────────────────────────────────────────────────
      const seCounts: Record<string, number> = {}
      for (const s of se ?? []) seCounts[s.effect_name] = (seCounts[s.effect_name] ?? 0) + 1
      setTopSideEffects(
        Object.entries(seCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10)
      )

      // ── Side effect severity split ─────────────────────────────────────────
      const sevMap: Record<string, { mild: number; moderate: number; severe: number }> = {
        'short_term': { mild: 0, moderate: 0, severe: 0 },
        'long_term':  { mild: 0, moderate: 0, severe: 0 },
      }
      for (const s of se ?? []) {
        const type = s.effect_type as string
        const sev  = s.severity as string
        if (sevMap[type] && sev in sevMap[type]) sevMap[type][sev as 'mild' | 'moderate' | 'severe']++
      }
      setSevSplit([
        { name: 'Short-term', ...sevMap['short_term'] },
        { name: 'Long-term',  ...sevMap['long_term'] },
      ])

      // ── Adherence ─────────────────────────────────────────────────────────
      const adhOrder = ['Always', 'Often', 'Sometimes', 'Rarely']
      const adhCounts: Record<string, number> = {}
      for (const l of ls ?? []) { const k = l.adherence_level ?? 'Unknown'; adhCounts[k] = (adhCounts[k] ?? 0) + 1 }
      setAdherence(adhOrder.map(name => ({ name, value: adhCounts[name] ?? 0 })))

      // ── Lifestyle radar ────────────────────────────────────────────────────
      const total = (ls ?? []).length || 1
      const goodDiet     = (ls ?? []).filter(l => l.diet_quality === 'Yes').length
      const active       = (ls ?? []).filter(l => l.physical_activity != null && l.physical_activity !== 'None').length
      const nonSmoker    = (ls ?? []).filter(l => l.smoking === 'Never').length
      const nonDrinker   = (ls ?? []).filter(l => (l as { alcohol?: string | null }).alcohol === 'Never').length
      const adherent     = (ls ?? []).filter(l => l.adherence_level === 'Always' || l.adherence_level === 'Often').length
      setLifestyle([
        { category: 'Good Diet',     positive: goodDiet,  total },
        { category: 'Active',        positive: active,    total },
        { category: 'Non-Smoker',    positive: nonSmoker, total },
        { category: 'Non-Drinker',   positive: nonDrinker,total },
        { category: 'Adherent',      positive: adherent,  total },
      ])

      // ── Diabetes types ────────────────────────────────────────────────────
      const typeCounts: Record<string, number> = {}
      for (const p of patients ?? []) {
        const t = p.diabetes_type ?? 'Unknown'
        typeCounts[t] = (typeCounts[t] ?? 0) + 1
      }
      setDiabetesTypes(Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

      // ── Treatment satisfaction ────────────────────────────────────────────
      const satCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      for (const q of qol ?? []) if (q.treatment_satisfaction) satCounts[String(q.treatment_satisfaction)] = (satCounts[String(q.treatment_satisfaction)] ?? 0) + 1
      setSatisfaction(Object.entries(satCounts).map(([score, count]) => ({ score: `★${score}`, count })))

      // ── Side effects by drug class (short vs long term) ───────────────────
      const seClassMap: Record<string, { short_term: number; long_term: number }> = {}
      for (const s of se ?? []) {
        // try to get drug class via survey join — approximate via all meds in system
      }
      // Use medWithClass to map survey_id → drug_class, then join with se survey_id
      const surveyClassMap: Record<string, string> = {}
      for (const m of medWithClass ?? []) {
        const cls = (m as { medications?: { drug_class?: string } | null }).medications?.drug_class
        if (cls && m.survey_id && !surveyClassMap[m.survey_id]) surveyClassMap[m.survey_id] = cls
      }
      for (const s of se ?? []) {
        const cls = surveyClassMap[s.survey_id] ?? 'Other'
        if (!seClassMap[cls]) seClassMap[cls] = { short_term: 0, long_term: 0 }
        if (s.effect_type === 'short_term') seClassMap[cls].short_term++
        else if (s.effect_type === 'long_term') seClassMap[cls].long_term++
      }
      setSeByClass(
        Object.entries(seClassMap)
          .map(([drug_class, v]) => ({ drug_class, ...v }))
          .filter(r => r.short_term + r.long_term >= 3)
          .sort((a, b) => (b.short_term + b.long_term) - (a.short_term + a.long_term))
          .slice(0, 8)
      )

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  const radarData = lifestyle.map(l => ({
    category: l.category,
    pct: Math.round((l.positive / l.total) * 100),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-gray-400 text-sm">Cohort-level analysis across all submitted surveys.</p>
      </div>

      {/* ── Section 1: Glycaemic ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Glycaemic Control</p>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <SectionHeader title="HbA1c Distribution" sub="All real submitted surveys with HbA1c recorded" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hba1cBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Glycaemic Control Status" sub="HbA1c ≥ 7.5% or FBS ≥ 180 mg/dL = poor control" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={glycControl} dataKey="value" nameKey="name" outerRadius={80} cx="40%">
                  <Cell fill="#F87171" />
                  <Cell fill="#34D399" />
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>

      {/* ── Section 2: Medications ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Medications</p>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard>
            <SectionHeader title="Drug Class Distribution" sub="All medication records across real patients" />
            {medClasses.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={medClasses} dataKey="value" nameKey="name" outerRadius={80} cx="40%">
                    {medClasses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  <Tooltip contentStyle={TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="py-12 text-center text-gray-500 text-sm">No data</div>}
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Side Effects by Drug Class" sub="Short-term vs long-term counts per drug class" />
            {seByClass.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={seByClass} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="drug_class" tick={{ fontSize: 9, fill: '#6b7280' }} interval={0} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  <Bar dataKey="short_term" name="Short-term" stackId="a" fill="#60A5FA" radius={[0,0,0,0]} />
                  <Bar dataKey="long_term"  name="Long-term"  stackId="a" fill="#A78BFA" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="py-12 text-center text-gray-500 text-sm">No data</div>}
          </GlassCard>
        </div>
      </div>

      {/* ── Section 3: Side Effects ────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Side Effects</p>
        <div className="grid grid-cols-2 gap-6">
          <GlassCard className="col-span-2">
            <SectionHeader title="Top 10 Reported Side Effects" />
            {topSideEffects.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topSideEffects} layout="vertical" margin={{ top: 4, right: 20, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="count" fill="#60A5FA" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="py-12 text-center text-gray-500 text-sm">No data</div>}
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Severity Split by Effect Type" sub="Short-term vs long-term × mild / moderate / severe" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sevSplit} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Bar dataKey="mild"     name="Mild"     stackId="a" fill={SEV_COLORS.mild}     radius={[0,0,0,0]} />
                <Bar dataKey="moderate" name="Moderate" stackId="a" fill={SEV_COLORS.moderate} radius={[0,0,0,0]} />
                <Bar dataKey="severe"   name="Severe"   stackId="a" fill={SEV_COLORS.severe}   radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Diabetes Type Distribution" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={diabetesTypes} dataKey="value" nameKey="name" outerRadius={80} cx="40%">
                  {diabetesTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>

      {/* ── Section 4: Patient Behaviour ──────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">Patient Behaviour & Quality of Life</p>
        <div className="grid grid-cols-3 gap-6">
          <GlassCard>
            <SectionHeader title="Medication Adherence" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={adherence} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {adherence.map((_, i) => (
                    <Cell key={i} fill={['#34D399','#60A5FA','#FBBF24','#F87171'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Treatment Satisfaction" sub="1 = very dissatisfied · 5 = very satisfied" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={satisfaction} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {satisfaction.map((_, i) => (
                    <Cell key={i} fill={['#F87171','#FBBF24','#60A5FA','#34D399','#34D399'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Lifestyle Profile" sub="% of cohort meeting each positive criterion" />
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Radar name="%" dataKey="pct" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
