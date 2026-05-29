import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/primitives/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/primitives/tabs'
import { SideEffectsPanel, type SideEffectRow } from '../../components/analytics/SideEffectsPanel'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { Users, Droplet, AlertTriangle, Smile, Filter } from 'lucide-react'

const COLORS = ['#3B82F6', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#2DD4BF']
const TOOLTIP = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 500,
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
}

// Custom tooltip for pie/radial charts that shows name, value, and percentage
function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { value: number } }[] }) {
  if (!active || !payload?.length) return null
  const total = payload[0]?.payload as unknown as { total?: number }
  const entry = payload[0]
  return (
    <div style={{ ...TOOLTIP, padding: '8px 12px', minWidth: 120 }}>
      <p style={{ color: '#0f172a', fontWeight: 600, marginBottom: 2 }}>{entry.name}</p>
      <p style={{ color: '#334155' }}>{entry.value} records</p>
      {(total as any)?.total && (
        <p style={{ color: '#64748b', fontSize: 11 }}>{Math.round((entry.value / (total as any).total) * 100)}% of cohort</p>
      )}
    </div>
  )
}
const ALL = '__all__'

// ── Joined survey-level record assembled client-side ──────────────────────────
interface SurveyRecord {
  survey_id: string
  uid: string
  diabetes_type: string | null
  hba1c: number | null
  fasting_glucose: number | null
  drug_classes: string[]
  drug_names: string[]
  adherence_level: string | null
  diet_quality: string | null
  physical_activity: string | null
  smoking: string | null
  alcohol: string | null
  treatment_satisfaction: number | null
  side_effects: SideEffectRow[]
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-400">{children}</p>
}

function ChartCard({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <GlassCard className={className}>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
      {children}
    </GlassCard>
  )
}

function Kpi({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-gray-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${color}`}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>
    </motion.div>
  )
}

function DrugClassAccordion({ className, total, drugs, color }: {
  className: string; total: number; drugs: { name: string; count: number }[]; color: string
}) {
  const [open, setOpen] = useState(false)
  const maxCount = drugs[0]?.count || 1
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-white">{className}</span>
          <span className="text-xs text-gray-500">({drugs.length} drug{drugs.length !== 1 ? 's' : ''})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">{total} records</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
            className="text-gray-500 text-xs">▼</motion.span>
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/[0.06]">
          {drugs.map(drug => {
            const pct = Math.round((drug.count / total) * 100)
            const barPct = Math.round((drug.count / maxCount) * 100)
            return (
              <div key={drug.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-300 truncate mr-2">{drug.name}</span>
                  <span className="text-xs font-semibold text-gray-200 flex-shrink-0">{drug.count} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: open ? `${barPct}%` : 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, opacity: 0.8 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export function Analytics() {
  const [records, setRecords] = useState<SurveyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dtFilter, setDtFilter] = useState<string>(ALL)
  const [dcFilter, setDcFilter] = useState<string>(ALL)
  const [seView, setSeView] = useState<string>('compare')

  useEffect(() => {
    async function load() {
      // Fetch everything flat to avoid PostgREST nested-row caps, then join client-side.
      const [
        { data: surveys },
        { data: patients },
        { data: measurements },
        { data: lifestyleRows },
        { data: qolRows },
        { data: medRows },
        { data: seRows },
      ] = await Promise.all([
        supabase.from('surveys').select('id, uid').eq('status', 'submitted').eq('data_source', 'real').limit(2000),
        supabase.from('patients').select('uid, diabetes_type').limit(2000),
        supabase.from('measurements').select('survey_id, hba1c, fasting_glucose').limit(2000),
        supabase.from('lifestyle').select('survey_id, adherence_level, diet_quality, physical_activity, smoking, alcohol').limit(2000),
        supabase.from('quality_of_life').select('survey_id, treatment_satisfaction').limit(2000),
        supabase.from('patient_medications').select('survey_id, medications(name, drug_class)').limit(5000),
        supabase.from('side_effects').select('survey_id, effect_name, effect_type, severity, onset_time, ongoing, caused_med_change, reported_to_doctor').limit(5000),
      ])

      const dtByUid    = new Map((patients ?? []).map(p => [p.uid, p.diabetes_type ?? null]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const measBySid  = new Map((measurements ?? []).map((m: any) => [m.survey_id, m]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lsBySid    = new Map((lifestyleRows ?? []).map((l: any) => [l.survey_id, l]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const qolBySid   = new Map((qolRows ?? []).map((q: any) => [q.survey_id, q]))
      const classBySid = new Map<string, string[]>()
      const nameBySid  = new Map<string, string[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of medRows ?? []) {
        const cls  = (m as any).medications?.drug_class
        const name = (m as any).medications?.name
        const sid  = (m as any).survey_id as string
        if (cls) { const a = classBySid.get(sid) ?? []; a.push(cls); classBySid.set(sid, a) }
        if (name) { const a = nameBySid.get(sid) ?? []; a.push(name); nameBySid.set(sid, a) }
      }
      const seBySid = new Map<string, SideEffectRow[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const se of seRows ?? []) {
        const arr = seBySid.get((se as any).survey_id) ?? []
        arr.push(se as unknown as SideEffectRow)
        seBySid.set((se as any).survey_id, arr)
      }

      const recs: SurveyRecord[] = (surveys ?? []).map((s) => {
        const meas = measBySid.get(s.id) as any
        const ls   = lsBySid.get(s.id) as any
        const qol  = qolBySid.get(s.id) as any
        return {
          survey_id: s.id,
          uid: s.uid,
          diabetes_type: dtByUid.get(s.uid) ?? null,
          hba1c: meas?.hba1c ?? null,
          fasting_glucose: meas?.fasting_glucose ?? null,
          drug_classes: classBySid.get(s.id) ?? [],
          drug_names: nameBySid.get(s.id) ?? [],
          adherence_level: ls?.adherence_level ?? null,
          diet_quality: ls?.diet_quality ?? null,
          physical_activity: ls?.physical_activity ?? null,
          smoking: ls?.smoking ?? null,
          alcohol: ls?.alcohol ?? null,
          treatment_satisfaction: qol?.treatment_satisfaction ?? null,
          side_effects: seBySid.get(s.id) ?? [],
        }
      })
      setRecords(recs)
      setLoading(false)
    }
    load()
  }, [])

  // ── Filter option lists ─────────────────────────────────────────────────────
  const diabetesTypeOptions = useMemo(() => {
    const s = new Set<string>()
    records.forEach(r => r.diabetes_type && s.add(r.diabetes_type))
    return Array.from(s).sort()
  }, [records])

  const drugClassOptions = useMemo(() => {
    const s = new Set<string>()
    records.forEach(r => r.drug_classes.forEach(c => s.add(c)))
    return Array.from(s).sort()
  }, [records])

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => records.filter(r => {
    if (dtFilter !== ALL && r.diabetes_type !== dtFilter) return false
    if (dcFilter !== ALL && !r.drug_classes.includes(dcFilter)) return false
    return true
  }), [records, dtFilter, dcFilter])

  // ── Derived datasets ────────────────────────────────────────────────────────
  const allSideEffects = useMemo(() => filtered.flatMap(r => r.side_effects), [filtered])

  const hba1cBuckets = useMemo(() => {
    const b: Record<string, number> = { '<6': 0, '6–7': 0, '7–8': 0, '8–9': 0, '9–10': 0, '≥10': 0 }
    for (const r of filtered) {
      const v = r.hba1c
      if (v == null) continue
      if (v < 6) b['<6']++; else if (v < 7) b['6–7']++; else if (v < 8) b['7–8']++
      else if (v < 9) b['8–9']++; else if (v < 10) b['9–10']++; else b['≥10']++
    }
    return Object.entries(b).map(([range, count]) => ({ range, count }))
  }, [filtered])

  const glycControl = useMemo(() => {
    let poor = 0, ctrl = 0
    for (const r of filtered) {
      if (r.hba1c == null && r.fasting_glucose == null) continue
      if ((r.hba1c != null && r.hba1c >= 7.5) || (r.fasting_glucose != null && r.fasting_glucose >= 180)) poor++
      else ctrl++
    }
    return [{ name: 'Poor control', value: poor }, { name: 'Controlled', value: ctrl }]
  }, [filtered])

  const medClasses = useMemo(() => {
    const c: Record<string, number> = {}
    filtered.forEach(r => r.drug_classes.forEach(cls => { c[cls] = (c[cls] ?? 0) + 1 }))
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [filtered])

  // Per-class drug breakdown: { class → [{ drug, count }] }
  const medDrugsByClass = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    filtered.forEach(r => {
      r.drug_names.forEach((drugName, idx) => {
        const cls = r.drug_classes[idx] ?? 'Other'
        if (!map[cls]) map[cls] = {}
        map[cls][drugName] = (map[cls][drugName] ?? 0) + 1
      })
    })
    const result: Record<string, { name: string; count: number }[]> = {}
    for (const [cls, drugs] of Object.entries(map)) {
      result[cls] = Object.entries(drugs).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    }
    return result
  }, [filtered])

  const adherence = useMemo(() => {
    const order = ['Always', 'Often', 'Sometimes', 'Rarely']
    const c: Record<string, number> = {}
    filtered.forEach(r => { const k = r.adherence_level ?? 'Unknown'; c[k] = (c[k] ?? 0) + 1 })
    return order.map(name => ({ name, value: c[name] ?? 0 }))
  }, [filtered])

  const satisfaction = useMemo(() => {
    const c: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    filtered.forEach(r => { if (r.treatment_satisfaction) c[String(r.treatment_satisfaction)]++ })
    return Object.entries(c).map(([score, count]) => ({ score: `★${score}`, count }))
  }, [filtered])

  const radarData = useMemo(() => {
    const total = filtered.length || 1
    const pct = (n: number) => Math.round((n / total) * 100)
    return [
      { category: 'Good Diet',   pct: pct(filtered.filter(r => r.diet_quality === 'Yes').length) },
      { category: 'Active',      pct: pct(filtered.filter(r => r.physical_activity != null && r.physical_activity !== 'None').length) },
      { category: 'Non-Smoker',  pct: pct(filtered.filter(r => r.smoking === 'Never').length) },
      { category: 'Non-Drinker', pct: pct(filtered.filter(r => r.alcohol === 'Never').length) },
      { category: 'Adherent',    pct: pct(filtered.filter(r => r.adherence_level === 'Always' || r.adherence_level === 'Often').length) },
    ]
  }, [filtered])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const withGly = filtered.filter(r => r.hba1c != null || r.fasting_glucose != null)
    const poor = withGly.filter(r => (r.hba1c != null && r.hba1c >= 7.5) || (r.fasting_glucose != null && r.fasting_glucose >= 180)).length
    const sats = filtered.map(r => r.treatment_satisfaction).filter((v): v is number => v != null)
    const avgSat = sats.length ? (sats.reduce((a, b) => a + b, 0) / sats.length).toFixed(1) : '—'
    const seReports = filtered.flatMap(r => r.side_effects).length
    const patientsWithSe = filtered.filter(r => r.side_effects.length > 0).length
    return {
      cohort: filtered.length,
      poorPct: withGly.length ? Math.round((poor / withGly.length) * 100) : 0,
      avgSat,
      seReports,
      patientsWithSe,
    }
  }, [filtered])

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading analytics…</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-gray-400">Interactive cohort analysis across all real submitted surveys.</p>
        </div>

        {/* ── Cohort filter bar ── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Filter size={13} /> Cohort</span>
          <Select value={dtFilter} onValueChange={setDtFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Diabetes type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All diabetes types</SelectItem>
              {diabetesTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dcFilter} onValueChange={setDcFilter}>
            <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue placeholder="Drug class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All drug classes</SelectItem>
              {drugClassOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {(dtFilter !== ALL || dcFilter !== ALL) && (
            <button onClick={() => { setDtFilter(ALL); setDcFilter(ALL) }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users size={15} className="text-blue-400" />} color="text-blue-400 bg-blue-500/10 border-blue-500/20"
          label="Cohort size" value={String(kpis.cohort)} sub="surveys in view" />
        <Kpi icon={<Droplet size={15} className="text-red-400" />} color="text-red-400 bg-red-500/10 border-red-500/20"
          label="Poor control" value={`${kpis.poorPct}%`} sub="HbA1c≥7.5 or FBS≥180" />
        <Kpi icon={<AlertTriangle size={15} className="text-amber-400" />} color="text-amber-400 bg-amber-500/10 border-amber-500/20"
          label="Side-effect reports" value={String(kpis.seReports)} sub={`${kpis.patientsWithSe} patients affected`} />
        <Kpi icon={<Smile size={15} className="text-emerald-400" />} color="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          label="Avg satisfaction" value={`${kpis.avgSat}`} sub="out of 5" />
      </div>

      {/* ── Side effects: short-term vs long-term ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel>Side Effects · Short-term vs Long-term</SectionLabel>
          <Tabs value={seView} onValueChange={setSeView}>
            <TabsList>
              <TabsTrigger value="compare">Top effects</TabsTrigger>
              <TabsTrigger value="severity">Severity</TabsTrigger>
              <TabsTrigger value="onset">Onset</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {allSideEffects.length > 0 ? (
          <SideEffectsPanel rows={allSideEffects} view={seView} />
        ) : (
          <GlassCard><div className="py-12 text-center text-sm text-gray-500">No side effects reported in this cohort.</div></GlassCard>
        )}
      </div>

      {/* ── Glycaemic control ── */}
      <div>
        <SectionLabel>Glycaemic Control</SectionLabel>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="HbA1c Distribution" sub="Surveys with HbA1c recorded">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hba1cBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Glycaemic Control Status" sub="Poor = HbA1c ≥ 7.5% or FBS ≥ 180 mg/dL">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={glycControl.map(d => ({ ...d, total: glycControl.reduce((s, x) => s + x.value, 0) }))}
                  dataKey="value" nameKey="name" outerRadius={80} cx="40%">
                  <Cell fill="#F87171" /><Cell fill="#34D399" />
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ── Medications ── */}
      <div>
        <SectionLabel>Medications</SectionLabel>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: class-level pie */}
          <ChartCard title="Drug Class Distribution" sub="Prescriptions by class across the cohort">
            {medClasses.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={medClasses.map(d => ({ ...d, total: medClasses.reduce((s, x) => s + x.value, 0) }))}
                    dataKey="value" nameKey="name" outerRadius={90} cx="40%">
                    {medClasses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="py-12 text-center text-sm text-gray-500">No data</div>}
          </ChartCard>

          {/* Right: per-class drug breakdown — expandable accordion */}
          <GlassCard>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white">Drugs by Class</h3>
              <p className="mt-0.5 text-xs text-gray-500">Individual drug usage within each class — click a class to expand</p>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {medClasses.map((cls, ci) => {
                const drugs = medDrugsByClass[cls.name] ?? []
                const color = COLORS[ci % COLORS.length]
                const classTotal = drugs.reduce((s, d) => s + d.count, 0)
                return (
                  <DrugClassAccordion
                    key={cls.name}
                    className={cls.name}
                    total={classTotal}
                    drugs={drugs}
                    color={color}
                  />
                )
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Behaviour & QoL ── */}
      <div>
        <SectionLabel>Patient Behaviour & Quality of Life</SectionLabel>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Medication Adherence">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={adherence} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {adherence.map((_, i) => <Cell key={i} fill={['#34D399', '#60A5FA', '#FBBF24', '#F87171'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Treatment Satisfaction" sub="1 = very dissatisfied · 5 = very satisfied">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={satisfaction} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {satisfaction.map((_, i) => <Cell key={i} fill={['#F87171', '#FBBF24', '#60A5FA', '#34D399', '#34D399'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Lifestyle Profile" sub="% of cohort meeting each criterion">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Radar name="%" dataKey="pct" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
