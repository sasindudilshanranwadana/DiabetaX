import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts'
import { Activity, Clock, AlertCircle, Stethoscope, RefreshCw, TrendingUp } from 'lucide-react'

export interface SideEffectRow {
  effect_name: string
  effect_type: 'short_term' | 'long_term' | string
  severity: 'mild' | 'moderate' | 'severe' | string | null
  onset_time: string | null
  ongoing: boolean | null
  caused_med_change: boolean | null
  reported_to_doctor: boolean | null
  survey_id: string | null
}

const SEV_COLORS: Record<string, string> = { mild: '#34D399', moderate: '#FBBF24', severe: '#F87171' }
const ONSET_ORDER = ['<1 month', '1-6 months', '>6 months', 'not sure']
const TOOLTIP = { backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }

interface SideStats {
  total: number
  patients: number
  severity: { mild: number; moderate: number; severe: number }
  topEffects: { name: string; count: number }[]
  onset: { name: string; count: number }[]
  pctOngoing: number
  pctMedChange: number
  pctReported: number
  severeShare: number
}

function computeStats(rows: SideEffectRow[]): SideStats {
  const severity = { mild: 0, moderate: 0, severe: 0 }
  const effectCounts: Record<string, number> = {}
  const onsetCounts: Record<string, number> = {}
  const patients = new Set<string>()
  let ongoing = 0, medChange = 0, reported = 0

  for (const r of rows) {
    if (r.severity && r.severity in severity) severity[r.severity as 'mild' | 'moderate' | 'severe']++
    effectCounts[r.effect_name] = (effectCounts[r.effect_name] ?? 0) + 1
    const onset = r.onset_time ?? 'not sure'
    onsetCounts[onset] = (onsetCounts[onset] ?? 0) + 1
    if (r.survey_id) patients.add(r.survey_id)
    if (r.ongoing) ongoing++
    if (r.caused_med_change) medChange++
    if (r.reported_to_doctor) reported++
  }

  const total = rows.length || 1
  return {
    total: rows.length,
    patients: patients.size,
    severity,
    topEffects: Object.entries(effectCounts).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6),
    onset: ONSET_ORDER.map(name => ({ name, count: onsetCounts[name] ?? 0 })),
    pctOngoing: Math.round((ongoing / total) * 100),
    pctMedChange: Math.round((medChange / total) * 100),
    pctReported: Math.round((reported / total) * 100),
    severeShare: Math.round((severity.severe / total) * 100),
  }
}

function MiniStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-white">{value}</p>
        <p className="truncate text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function Side({ title, subtitle, stats, tint, view }: {
  title: string; subtitle: string; stats: SideStats; tint: 'blue' | 'purple'; view: string
}) {
  const ring = tint === 'blue' ? 'ring-blue-500/30' : 'ring-purple-500/30'
  const headTint = tint === 'blue' ? 'text-blue-300' : 'text-purple-300'
  const barFill = tint === 'blue' ? '#60A5FA' : '#A78BFA'
  const glow = tint === 'blue' ? 'from-blue-500/10' : 'from-purple-500/10'

  const gauge = [{ name: 'severe', value: stats.severeShare, fill: stats.severeShare >= 20 ? '#F87171' : barFill }]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${glow} to-transparent p-5 ring-1 ${ring}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h4 className={`text-sm font-bold ${headTint}`}>{title}</h4>
          <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-white">{stats.total}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">reports</p>
        </div>
      </div>

      {/* mini-stats row */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <MiniStat icon={<Activity size={14} className="text-emerald-300" />} accent="bg-emerald-500/15" label="patients affected" value={String(stats.patients)} />
        <MiniStat icon={<TrendingUp size={14} className="text-amber-300" />} accent="bg-amber-500/15" label="still ongoing" value={`${stats.pctOngoing}%`} />
        <MiniStat icon={<RefreshCw size={14} className="text-red-300" />} accent="bg-red-500/15" label="caused med change" value={`${stats.pctMedChange}%`} />
        <MiniStat icon={<Stethoscope size={14} className="text-blue-300" />} accent="bg-blue-500/15" label="reported to doctor" value={`${stats.pctReported}%`} />
      </div>

      {/* view-dependent chart */}
      {view === 'compare' && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">Top effects</p>
          {stats.topEffects.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={stats.topEffects} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={92} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill={barFill} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="py-12 text-center text-xs text-gray-600">No reports in this cohort</div>}
        </div>
      )}

      {view === 'severity' && (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={170}>
            <RadialBarChart innerRadius="62%" outerRadius="100%" data={gauge} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={8} />
              <text x="50%" y="48%" textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700}>{stats.severeShare}%</text>
              <text x="50%" y="62%" textAnchor="middle" fill="#6b7280" fontSize={9}>severe</text>
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {(['mild', 'moderate', 'severe'] as const).map(k => {
              const c = stats.severity[k]
              const pct = stats.total ? Math.round((c / stats.total) * 100) : 0
              return (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="capitalize text-gray-400">{k}</span>
                    <span className="text-gray-300">{c} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                      className="h-full rounded-full" style={{ background: SEV_COLORS[k] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'onset' && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">Time to onset</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={stats.onset} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.onset.map((_, i) => <Cell key={i} fill={barFill} fillOpacity={1 - i * 0.18} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

export function SideEffectsPanel({ rows, view }: { rows: SideEffectRow[]; view: string }) {
  const shortStats = useMemo(() => computeStats(rows.filter(r => r.effect_type === 'short_term')), [rows])
  const longStats  = useMemo(() => computeStats(rows.filter(r => r.effect_type === 'long_term')), [rows])

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Side
        title="Short-term Side Effects"
        subtitle="Acute, early-onset reactions"
        stats={shortStats}
        tint="blue"
        view={view}
      />
      <Side
        title="Long-term Side Effects"
        subtitle="Chronic / delayed reactions"
        stats={longStats}
        tint="purple"
        view={view}
      />

      {/* comparison divider with key deltas */}
      <div className="lg:col-span-2 -mt-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
        <Delta icon={<AlertCircle size={13} />} label="Severe share" a={shortStats.severeShare} b={longStats.severeShare} unit="%" />
        <Delta icon={<Clock size={13} />} label="Ongoing" a={shortStats.pctOngoing} b={longStats.pctOngoing} unit="%" />
        <Delta icon={<RefreshCw size={13} />} label="Med change" a={shortStats.pctMedChange} b={longStats.pctMedChange} unit="%" />
        <Delta icon={<Stethoscope size={13} />} label="Reported" a={shortStats.pctReported} b={longStats.pctReported} unit="%" />
      </div>
    </div>
  )
}

function Delta({ icon, label, a, b, unit }: { icon: React.ReactNode; label: string; a: number; b: number; unit: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-blue-300">{a}{unit}</span>
      <span className="text-gray-600">vs</span>
      <span className="font-semibold text-purple-300">{b}{unit}</span>
    </div>
  )
}
