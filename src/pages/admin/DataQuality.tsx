import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface Issue {
  type: string
  description: string
  count: number
  severity: 'high' | 'medium' | 'low'
}

export function DataQuality() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const found: Issue[] = []

      // Missing HbA1c in submitted surveys
      const { data: submittedSurveys } = await supabase.from('surveys').select('id').eq('status', 'submitted')
      const submittedIds = submittedSurveys?.map(s => s.id) ?? []

      if (submittedIds.length > 0) {
        const { data: meas } = await supabase.from('measurements').select('survey_id').in('survey_id', submittedIds).not('hba1c', 'is', null)
        const measIds = new Set(meas?.map(m => m.survey_id))
        const missing = submittedIds.filter(id => !measIds.has(id)).length
        if (missing > 0) found.push({ type: 'Missing HbA1c', description: 'Submitted surveys without an HbA1c measurement', count: missing, severity: 'high' })
      }

      // HbA1c outliers
      const { data: hba1cRows } = await supabase.from('measurements').select('hba1c').not('hba1c', 'is', null)
      const outliers = (hba1cRows ?? []).filter(r => r.hba1c < 3.5 || r.hba1c > 20).length
      if (outliers > 0) found.push({ type: 'HbA1c Outliers', description: 'HbA1c values outside 3.5–20% range', count: outliers, severity: 'high' })

      // Stale drafts (> 30 days)
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { count: staleDrafts } = await supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'draft').lt('created_at', cutoff)
      if ((staleDrafts ?? 0) > 0) found.push({ type: 'Stale Drafts', description: 'Draft surveys older than 30 days', count: staleDrafts ?? 0, severity: 'medium' })

      // Patients with no profile
      const { data: profiles } = await supabase.from('profiles').select('uid').eq('role', 'patient')
      if (profiles?.length) {
        const uids = profiles.map(p => p.uid)
        const { data: patients } = await supabase.from('patients').select('uid').in('uid', uids)
        const patientUids = new Set(patients?.map(p => p.uid))
        const noProfile = uids.filter(uid => !patientUids.has(uid)).length
        if (noProfile > 0) found.push({ type: 'Incomplete Profiles', description: 'Patients who registered but have not filled in their profile', count: noProfile, severity: 'low' })
      }

      // Medications with missing dose
      const { count: missingDose } = await supabase.from('patient_medications').select('*', { count: 'exact', head: true }).is('dose_value', null)
      if ((missingDose ?? 0) > 0) found.push({ type: 'Missing Dose', description: 'Medication records without a dose value', count: missingDose ?? 0, severity: 'low' })

      setIssues(found)
      setLoading(false)
    }
    load()
  }, [])

  const severityColor = { high: 'text-red-400 bg-red-500/10 border-red-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', low: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Data Quality</h2>
        <p className="text-gray-400 text-sm">Automated checks for missing data, outliers, and stale records.</p>
      </div>

      {issues.length === 0 ? (
        <GlassCard>
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle size={32} className="text-emerald-400" />
            <p className="text-white font-medium">No issues found</p>
            <p className="text-xs text-gray-500">All data quality checks passed.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <GlassCard key={i}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className={`mt-0.5 ${issue.severity === 'high' ? 'text-red-400' : issue.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                  <div>
                    <p className="text-white font-medium text-sm">{issue.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{issue.count}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColor[issue.severity]}`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
