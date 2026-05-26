import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

interface Issue {
  type: string
  description: string
  count: number
  severity: 'high' | 'medium' | 'low'
}

export function DataQuality() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  async function load() {
    setLoading(true)
    const found: Issue[] = []

    // ── 1 & 2. Missing HbA1c / FBS on submitted real surveys ────────────────
    // Fetch all measurements for real submitted surveys, check nulls client-side
    // (avoids complex join filter syntax issues with supabase-js)
    const { data: realMeasurements } = await supabase
      .from('measurements')
      .select('survey_id, hba1c, fasting_glucose, surveys!inner(status, data_source)')
      .eq('surveys.status', 'submitted')
      .eq('surveys.data_source', 'real')
    const missingHba1c = (realMeasurements ?? []).filter(m => m.hba1c == null).length
    const missingFbs   = (realMeasurements ?? []).filter(m => m.fasting_glucose == null).length
    if (missingHba1c > 0)
      found.push({
        type: 'Missing HbA1c',
        description: 'Submitted real surveys without an HbA1c value — FBS proxy used for ML',
        count: missingHba1c,
        severity: 'medium',
      })
    if (missingFbs > 0)
      found.push({
        type: 'Missing Fasting Blood Sugar',
        description: 'Submitted real surveys with neither HbA1c nor FBS — no glycaemic data available',
        count: missingFbs,
        severity: 'high',
      })

    // ── 3. HbA1c outliers (< 3.5 or > 20) ──────────────────────────────────
    const { count: hba1cHigh } = await supabase
      .from('measurements')
      .select('*', { count: 'exact', head: true })
      .gt('hba1c', 20)
    const { count: hba1cLow } = await supabase
      .from('measurements')
      .select('*', { count: 'exact', head: true })
      .not('hba1c', 'is', null)
      .lt('hba1c', 3.5)
    const outliers = (hba1cHigh ?? 0) + (hba1cLow ?? 0)
    if (outliers > 0)
      found.push({
        type: 'HbA1c Outliers',
        description: 'HbA1c values outside valid range (3.5–20%)',
        count: outliers,
        severity: 'high',
      })

    // ── 4. FBS outliers (> 600 mg/dL) ────────────────────────────────────────
    const { count: fbsHigh } = await supabase
      .from('measurements')
      .select('*', { count: 'exact', head: true })
      .gt('fasting_glucose', 600)
    if ((fbsHigh ?? 0) > 0)
      found.push({
        type: 'FBS Outliers',
        description: 'Fasting blood sugar values above 600 mg/dL — likely data entry errors',
        count: fbsHigh ?? 0,
        severity: 'high',
      })

    // ── 5. Stale drafts (> 30 days old) ─────────────────────────────────────
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: staleDrafts } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .lt('created_at', cutoff)
    if ((staleDrafts ?? 0) > 0)
      found.push({
        type: 'Stale Drafts',
        description: 'Draft surveys not updated in over 30 days',
        count: staleDrafts ?? 0,
        severity: 'medium',
      })

    // ── 6. Patients who registered but never completed profile ───────────────
    // participant_code is null for users who never completed registration flow
    const { count: noProfile } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'patient')
      .is('participant_code', null)
    if ((noProfile ?? 0) > 0)
      found.push({
        type: 'Incomplete Profiles',
        description: 'Patients who signed up but have not completed their profile',
        count: noProfile ?? 0,
        severity: 'low',
      })

    // ── 7. Surveys marked exclude_from_ml ────────────────────────────────────
    const { count: excluded } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('exclude_from_ml', true)
      .eq('status', 'submitted')
    if ((excluded ?? 0) > 0)
      found.push({
        type: 'Excluded from ML',
        description: 'Submitted surveys manually flagged to exclude from model training',
        count: excluded ?? 0,
        severity: 'low',
      })

    // ── 8. Submitted real surveys with no medication records ─────────────────
    // Get survey IDs for real submitted surveys, then find which have no meds
    const { data: realSurveys } = await supabase
      .from('surveys')
      .select('id')
      .eq('status', 'submitted')
      .eq('data_source', 'real')
    const realSurveyIds = realSurveys?.map(s => s.id) ?? []
    if (realSurveyIds.length > 0) {
      const { data: medsRows } = await supabase
        .from('patient_medications')
        .select('survey_id')
        .in('survey_id', realSurveyIds)
      const surveyIdsWithMeds = new Set(medsRows?.map(m => m.survey_id))
      const noMeds = realSurveyIds.filter(id => !surveyIdsWithMeds.has(id)).length
      if (noMeds > 0)
        found.push({
          type: 'No Medication Recorded',
          description: 'Submitted real surveys with no antidiabetic medication on record',
          count: noMeds,
          severity: 'medium',
        })
    }

    // ── 9. Medication records with missing dose ──────────────────────────────
    const { count: missingDose } = await supabase
      .from('patient_medications')
      .select('*', { count: 'exact', head: true })
      .is('dose_value', null)
    if ((missingDose ?? 0) > 0)
      found.push({
        type: 'Missing Medication Dose',
        description: 'Medication records without a dose value',
        count: missingDose ?? 0,
        severity: 'low',
      })

    setIssues(found)
    setLastRun(new Date())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const severityColor = {
    high:   'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  const highCount   = issues.filter(i => i.severity === 'high').length
  const medCount    = issues.filter(i => i.severity === 'medium').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Data Quality</h2>
          <p className="text-gray-400 text-sm">
            Automated checks for missing data, outliers, and stale records.
            {lastRun && <span className="ml-2 text-gray-500">Last run: {lastRun.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      {!loading && issues.length > 0 && (
        <div className="flex gap-3">
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle size={12} />
              {highCount} high severity
            </div>
          )}
          {medCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle size={12} />
              {medCount} medium severity
            </div>
          )}
          {highCount === 0 && medCount === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
              <CheckCircle size={12} />
              No critical issues
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          <RefreshCw size={16} className="animate-spin mr-2" /> Running checks…
        </div>
      ) : issues.length === 0 ? (
        <GlassCard>
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle size={32} className="text-emerald-400" />
            <p className="text-white font-medium">No issues found</p>
            <p className="text-xs text-gray-500">All data quality checks passed.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {issues
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 }
              return order[a.severity] - order[b.severity]
            })
            .map((issue, i) => (
              <GlassCard key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <AlertTriangle
                      size={18}
                      className={`mt-0.5 flex-shrink-0 ${
                        issue.severity === 'high' ? 'text-red-400'
                        : issue.severity === 'medium' ? 'text-amber-400'
                        : 'text-blue-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm">{issue.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-2xl font-bold text-white">{issue.count.toLocaleString()}</span>
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
