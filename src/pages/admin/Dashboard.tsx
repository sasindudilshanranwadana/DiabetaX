import { useEffect, useState } from 'react'
import { Users, ClipboardList, Activity, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StatCard } from '../../components/ui/StatCard'
import { GlassCard } from '../../components/ui/GlassCard'

interface KPIs {
  participants: number
  submissions: number
  avgHba1c: number | null
  severeSideEffects: number
}

export function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs>({ participants: 0, submissions: 0, avgHba1c: null, severeSideEffects: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: participants },
        { count: submissions },
        { data: hba1cRows },
        { count: severe },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('measurements').select('hba1c').not('hba1c', 'is', null),
        supabase.from('side_effects').select('*', { count: 'exact', head: true }).eq('severity', 'severe'),
      ])

      const vals = (hba1cRows ?? []).map(r => r.hba1c).filter(Boolean) as number[]
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null

      setKpis({
        participants: participants ?? 0,
        submissions: submissions ?? 0,
        avgHba1c: avg,
        severeSideEffects: severe ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h2>
        <p className="text-gray-400 text-sm">Platform-wide research metrics.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Participants" value={kpis.participants} icon={<Users size={18} />} color="blue" />
        <StatCard label="Submissions" value={kpis.submissions} icon={<ClipboardList size={18} />} color="green" />
        <StatCard label="Avg HbA1c" value={kpis.avgHba1c ? `${kpis.avgHba1c.toFixed(1)}%` : '—'} icon={<Activity size={18} />} color="purple" />
        <StatCard label="Severe Side Effects" value={kpis.severeSideEffects} icon={<AlertTriangle size={18} />} color="red" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: 'View Participants', href: '/admin/participants' },
              { label: 'Review Submissions', href: '/admin/submissions' },
              { label: 'Analytics', href: '/admin/analytics' },
              { label: 'Data Quality', href: '/admin/data-quality' },
              { label: 'Exports', href: '/admin/exports' },
            ].map(link => (
              <a key={link.href} href={link.href} className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                {link.label} →
              </a>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Platform Notes</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <p>• Data includes synthetic (n=500) and real patient records.</p>
            <p>• All participant data is de-identified; researchers see participant codes only.</p>
            <p>• Exports are logged with timestamp and filters to <code className="text-gray-300">export_audit</code>.</p>
            <p>• CDS module access is restricted to clinician_admin role and fully audited.</p>
            <p>• ML model outputs are read-only in the UI; models are trained externally.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
