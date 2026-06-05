import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'

// Convert any boolean/true/false values to Yes/No throughout a row
function humaniseRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === true) out[k] = 'Yes'
    else if (v === false) out[k] = 'No'
    else out[k] = v
  }
  return out
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Array.from(rows.reduce((set, r) => {
    Object.keys(r).forEach(k => set.add(k))
    return set
  }, new Set<string>()))
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ]
  return lines.join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Exports() {
  const [loading, setLoading] = useState<string | null>(null)

  async function logExport(exportType: string, filters: Record<string, string> = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('uid', user.id).single()
    await supabase.from('export_audit').insert({
      uid: user.id,
      role: profile?.role ?? 'unknown',
      export_type: exportType,
      filters,
    })
  }

  // Build participant_code lookup map
  async function getParticipantMap(): Promise<Record<string, string>> {
    const { data } = await supabase.from('profiles').select('uid, participant_code')
    const map: Record<string, string> = {}
    for (const p of data ?? []) {
      if (p.participant_code) map[p.uid] = p.participant_code
    }
    return map
  }

  async function exportSurveys() {
    setLoading('surveys')
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'submitted')
    const pMap = await getParticipantMap()
    const rows = (data ?? []).map(r => {
      const { uid, ...rest } = r as Record<string, unknown>
      return humaniseRow({ participant_code: pMap[uid as string] ?? uid, ...rest })
    })
    await logExport('normalized_surveys')
    downloadCsv(toCsv(rows), 'diabetax_surveys.csv')
    setLoading(null)
  }

  async function exportMeasurements() {
    setLoading('measurements')
    // Join surveys → profiles for participant_code, and patients for height/weight/BMI
    const { data: mData } = await supabase
      .from('measurements')
      .select(`
        id,
        survey_id,
        hba1c,
        hba1c_date,
        fasting_glucose,
        glucose_unit,
        previous_hba1c,
        surveys!inner(uid, submitted_at,
          patients(height_cm, weight_kg))
      `)
    const pMap = await getParticipantMap()

    const rows = (mData ?? []).map((m: Record<string, unknown>) => {
      const survey = m.surveys as Record<string, unknown> | null
      const patient = (survey?.patients as Record<string, unknown> | null)
      const uid = survey?.uid as string
      const h = patient?.height_cm as number | null
      const w = patient?.weight_kg as number | null
      const bmi = h && w ? Math.round((w / Math.pow(h / 100, 2)) * 10) / 10 : null
      return humaniseRow({
        participant_code: pMap[uid] ?? uid,
        survey_id: m.survey_id,
        submission_date: survey?.submitted_at ?? null,
        hba1c_percent: m.hba1c,
        hba1c_date: m.hba1c_date,
        previous_hba1c_percent: m.previous_hba1c,
        fasting_glucose: m.fasting_glucose,
        glucose_unit: m.glucose_unit,
        height_cm: h,
        weight_kg: w,
        bmi,
      })
    })
    await logExport('normalized_measurements')
    downloadCsv(toCsv(rows), 'diabetax_measurements.csv')
    setLoading(null)
  }

  async function exportFlat() {
    setLoading('flat')
    // Use the human-readable export view (words, Yes/No, medication names)
    const { data } = await supabase.from('ai_export_dataset_v1').select('*')
    const pMap = await getParticipantMap()
    const rows = (data ?? []).map(r => {
      const row = r as Record<string, unknown>
      const uid = row.uid as string
      const { uid: _uid, ...rest } = row
      return humaniseRow({ participant_code: pMap[uid] ?? uid, ...rest })
    })
    await logExport('flat_ml_dataset')
    downloadCsv(toCsv(rows), 'diabetax_ml_dataset.csv')
    setLoading(null)
  }

  async function exportSideEffects() {
    setLoading('side_effects')
    // Fetch all side effects with survey + medication info
    const { data } = await supabase
      .from('side_effects')
      .select(`
        survey_id,
        effect_name,
        effect_type,
        severity,
        onset_time,
        ongoing,
        caused_med_change,
        reported_to_doctor,
        surveys!inner(uid, submitted_at,
          patient_medications(medications(name, drug_class)))
      `)
    const pMap = await getParticipantMap()

    // Group by survey_id — one row per survey, all side effects pivoted into short/long columns
    const grouped: Record<string, {
      participant_code: string
      submission_date: unknown
      medications: string
      short_term: { name: string; severity: string; ongoing: boolean; caused_change: boolean; reported: boolean }[]
      long_term:  { name: string; severity: string; ongoing: boolean; caused_change: boolean; reported: boolean }[]
    }> = {}

    for (const se of (data ?? []) as Record<string, unknown>[]) {
      const surveyKey = se.survey_id as string
      const survey = se.surveys as Record<string, unknown> | null
      const uid = survey?.uid as string

      if (!grouped[surveyKey]) {
        const meds = (survey?.patient_medications as Record<string, unknown>[] | null) ?? []
        const medNames = meds
          .map(pm => (pm.medications as Record<string, unknown> | null)?.name)
          .filter(Boolean).join(', ')
        grouped[surveyKey] = {
          participant_code: pMap[uid] ?? uid,
          submission_date: survey?.submitted_at ?? null,
          medications: medNames || '',
          short_term: [],
          long_term: [],
        }
      }

      const entry = {
        name: se.effect_name as string,
        severity: se.severity as string,
        ongoing: se.ongoing as boolean,
        caused_change: se.caused_med_change as boolean,
        reported: se.reported_to_doctor as boolean,
      }

      if (se.effect_type === 'short_term') grouped[surveyKey].short_term.push(entry)
      else if (se.effect_type === 'long_term') grouped[surveyKey].long_term.push(entry)
    }

    // Flatten: one row per patient, side effects as comma-joined name (severity) lists
    const rows = Object.values(grouped).map(g => humaniseRow({
      participant_code: g.participant_code,
      submission_date: g.submission_date,
      medications: g.medications || null,
      short_term_side_effects: g.short_term.length
        ? g.short_term.map(e => `${e.name} (${e.severity})`).join('; ')
        : 'None',
      short_term_count: g.short_term.length,
      short_term_ongoing: g.short_term.some(e => e.ongoing) ? 'Yes' : 'No',
      short_term_caused_med_change: g.short_term.some(e => e.caused_change) ? 'Yes' : 'No',
      short_term_reported_to_doctor: g.short_term.some(e => e.reported) ? 'Yes' : 'No',
      long_term_side_effects: g.long_term.length
        ? g.long_term.map(e => `${e.name} (${e.severity})`).join('; ')
        : 'None',
      long_term_count: g.long_term.length,
      long_term_ongoing: g.long_term.some(e => e.ongoing) ? 'Yes' : 'No',
      long_term_caused_med_change: g.long_term.some(e => e.caused_change) ? 'Yes' : 'No',
      long_term_reported_to_doctor: g.long_term.some(e => e.reported) ? 'Yes' : 'No',
    }))

    await logExport('normalized_side_effects')
    downloadCsv(toCsv(rows), 'diabetax_side_effects.csv')
    setLoading(null)
  }

  const exports = [
    {
      key: 'flat', label: 'Flat ML Dataset', icon: '🤖',
      desc: 'One row per survey — all features joined, human-readable (Yes/No, word counts, drug names).',
      action: exportFlat
    },
    {
      key: 'surveys', label: 'Survey Records', icon: '📋',
      desc: 'Survey metadata with participant code, submission date, data source.',
      action: exportSurveys
    },
    {
      key: 'measurements', label: 'Measurements', icon: '🩺',
      desc: 'HbA1c, fasting glucose, height, weight, BMI — one row per measurement record.',
      action: exportMeasurements
    },
    {
      key: 'side_effects', label: 'Side Effects', icon: '⚠️',
      desc: 'All reported side effects with participant code, medications, short/long term label, severity.',
      action: exportSideEffects
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Exports</h2>
        <p className="text-gray-400 text-sm">All exports are logged with timestamp and user to the audit trail.</p>
      </div>

      <div className="px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-300 text-xs">
        Exports contain de-identified data only. Personal identifiers are replaced with participant codes. All downloads are recorded in <code>export_audit</code>.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exports.map(exp => (
          <GlassCard key={exp.key}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">{exp.icon}</span>
              <div>
                <p className="text-white font-medium text-sm">{exp.label}</p>
                <p className="text-xs text-gray-400 mt-1">{exp.desc}</p>
              </div>
            </div>
            <button
              onClick={exp.action}
              disabled={loading === exp.key}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === exp.key ? (
                <>Preparing…</>
              ) : (
                <><Download size={13} /> Download CSV</>
              )}
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Export Audit Trail</h3>
        </div>
        <p className="text-xs text-gray-500">All exports above are automatically logged to the <code className="text-gray-400">export_audit</code> table with the exporting user's ID, role, timestamp, and export type.</p>
      </GlassCard>
    </div>
  )
}
