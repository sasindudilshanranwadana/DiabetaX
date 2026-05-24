import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#3B82F6', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#2DD4BF']

export function Analytics() {
  const [hba1cBuckets, setHba1cBuckets] = useState<{ range: string; count: number }[]>([])
  const [medClasses, setMedClasses] = useState<{ name: string; value: number }[]>([])
  const [topSideEffects, setTopSideEffects] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: meas }, { data: meds }, { data: se }] = await Promise.all([
        supabase.from('measurements').select('hba1c').not('hba1c', 'is', null),
        supabase.from('patient_medications').select('medication_id, medications(drug_class)'),
        supabase.from('side_effects').select('effect_name'),
      ])

      // HbA1c distribution buckets
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

      // Medication class distribution
      const classCounts: Record<string, number> = {}
      for (const m of meds ?? []) {
        const cls = (m as { medications?: { drug_class?: string } }).medications?.drug_class ?? 'Unknown'
        classCounts[cls] = (classCounts[cls] ?? 0) + 1
      }
      setMedClasses(Object.entries(classCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

      // Top side effects
      const seCounts: Record<string, number> = {}
      for (const s of se ?? []) {
        seCounts[s.effect_name] = (seCounts[s.effect_name] ?? 0) + 1
      }
      setTopSideEffects(
        Object.entries(seCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10)
      )

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  const tooltipStyle = { backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-gray-400 text-sm">Cohort-level analysis across all submitted surveys.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">HbA1c Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hba1cBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Medication Classes</h3>
          {medClasses.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={medClasses} dataKey="value" nameKey="name" outerRadius={80} cx="40%">
                  {medClasses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">No medication data</div>
          )}
        </GlassCard>

        <GlassCard className="col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Top 10 Reported Side Effects</h3>
          {topSideEffects.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSideEffects} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#60A5FA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">No side effect data</div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
