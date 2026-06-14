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
    const pMap = await getParticipantMap()

    // Step 1: measurements + survey uid/date
    const { data: mData } = await supabase
      .from('measurements')
      .select('id, survey_id, hba1c, hba1c_date, fasting_glucose, glucose_unit, previous_hba1c, surveys!inner(uid, submitted_at)')

    // Step 2: patients keyed by uid for height/weight
    const { data: patData } = await supabase
      .from('patients')
      .select('uid, height_cm, weight_kg')
    const patMap: Record<string, { height_cm: number | null; weight_kg: number | null }> = {}
    for (const p of patData ?? []) patMap[p.uid] = { height_cm: p.height_cm, weight_kg: p.weight_kg }

    const rows = (mData ?? []).map((m: Record<string, unknown>) => {
      const survey = m.surveys as Record<string, unknown> | null
      const uid = survey?.uid as string
      const pat = patMap[uid]
      const h = pat?.height_cm ?? null
      const w = pat?.weight_kg ?? null
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('ai_export_dataset_v1').select('*')
    const pMap = await getParticipantMap()
    const rows = (data ?? []).map(r => {
      const row = r as Record<string, unknown>
      const uid = row.uid as string
      const { uid: _uid, medication_name: _med, missed_doses_30d: _missed, qol_change, ...rest } = row
      return humaniseRow({
        participant_code: pMap[uid] ?? uid,
        ...rest,
        ...(qol_change !== undefined ? { quality_of_life_change: qol_change } : {}),
      })
    })
    await logExport('flat_ml_dataset')
    downloadCsv(toCsv(rows), 'diabetax_ml_dataset.csv')
    setLoading(null)
  }

  async function exportSideEffects() {
    setLoading('side_effects')
    // Fetch all side effects with survey info
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
        surveys!inner(uid, submitted_at)
      `)
    const pMap = await getParticipantMap()

    // Build uid -> drug classes map (so each patient's long-term risk can be
    // related to the drug class that drives it)
    const { data: pmData } = await supabase
      .from('patient_medications')
      .select('uid, medications(drug_class)')
    const classByUid: Record<string, Set<string>> = {}
    for (const pm of (pmData ?? []) as Record<string, unknown>[]) {
      const uid = pm.uid as string
      const med = pm.medications as Record<string, unknown> | null
      const cls = med?.drug_class as string | undefined
      if (uid && cls) (classByUid[uid] ??= new Set()).add(cls)
    }

    // Group by survey_id — one row per survey, all side effects pivoted into short/long columns
    type Entry = { name: string; severity: string; onset: string; ongoing: boolean; caused_change: boolean; reported: boolean }
    const grouped: Record<string, {
      participant_code: string
      uid: string
      submission_date: unknown
      short_term: Entry[]
      long_term:  Entry[]
    }> = {}

    for (const se of (data ?? []) as Record<string, unknown>[]) {
      const surveyKey = se.survey_id as string
      const survey = se.surveys as Record<string, unknown> | null
      const uid = survey?.uid as string

      if (!grouped[surveyKey]) {
        grouped[surveyKey] = {
          participant_code: pMap[uid] ?? uid,
          uid,
          submission_date: survey?.submitted_at ?? null,
          short_term: [],
          long_term: [],
        }
      }

      const entry: Entry = {
        name: se.effect_name as string,
        severity: se.severity as string,
        onset: (se.onset_time as string | null) ?? 'not sure',
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
      drug_classes: classByUid[g.uid] ? [...classByUid[g.uid]].join('; ') : 'None',
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
      long_term_onset: g.long_term.length
        ? [...new Set(g.long_term.map(e => e.onset))].join('; ')
        : 'N/A',
      long_term_ongoing: g.long_term.some(e => e.ongoing) ? 'Yes' : 'No',
      long_term_caused_med_change: g.long_term.some(e => e.caused_change) ? 'Yes' : 'No',
      long_term_reported_to_doctor: g.long_term.some(e => e.reported) ? 'Yes' : 'No',
    }))

    await logExport('normalized_side_effects')
    downloadCsv(toCsv(rows), 'diabetax_side_effects.csv')
    setLoading(null)
  }

  async function exportMedications() {
    setLoading('medications')
    const pMap = await getParticipantMap()

    const { data } = await supabase
      .from('patient_medications')
      .select(`
        survey_id,
        uid,
        dose_value,
        dose_unit,
        frequency,
        start_date,
        end_date,
        is_current,
        custom_name,
        medications(name, drug_class),
        surveys!inner(submitted_at, survey_type, med_changed, med_change_reason)
      `)

    // Group by uid+survey_id — one row per patient per survey
    type MedEntry = { drugClass: string; drugName: string; dose: string; frequency: string; isCurrent: boolean }
    type PatRow = {
      participant_code: string
      survey_id: string
      survey_type: string | null
      submission_date: unknown
      med_changed: unknown
      med_change_reason: string | null
      entries: MedEntry[]
    }
    const grouped: Record<string, PatRow> = {}

    for (const pm of (data ?? []) as Record<string, unknown>[]) {
      const key = `${pm.uid as string}__${pm.survey_id as string}`
      const med = pm.medications as Record<string, unknown> | null
      const survey = pm.surveys as Record<string, unknown> | null
      const uid = pm.uid as string
      const doseVal = pm.dose_value as number | null
      const doseUnit = pm.dose_unit as string | null
      const dose = doseVal && doseUnit ? `${doseVal} ${doseUnit}` : (doseVal ? String(doseVal) : '')

      if (!grouped[key]) {
        grouped[key] = {
          participant_code: pMap[uid] ?? uid,
          survey_id: pm.survey_id as string,
          survey_type: survey?.survey_type as string | null ?? null,
          submission_date: survey?.submitted_at ?? null,
          med_changed: survey?.med_changed ?? null,
          med_change_reason: (survey?.med_change_reason as string | null) ?? null,
          entries: [],
        }
      }
      grouped[key].entries.push({
        drugClass: (med?.drug_class as string | null) ?? 'Unknown',
        drugName: (pm.custom_name as string | null) || (med?.name as string | null) || 'Unknown',
        dose,
        frequency: (pm.frequency as string | null) ?? '',
        isCurrent: !!(pm.is_current),
      })
    }

    const rows = Object.values(grouped).map(g => {
      // Sort: current first, then by drug class
      g.entries.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || a.drugClass.localeCompare(b.drugClass))

      const current  = g.entries.filter(e => e.isCurrent)
      const previous = g.entries.filter(e => !e.isCurrent)

      const formatEntry = (e: MedEntry) =>
        `${e.drugClass} — ${e.drugName}${e.dose ? ' ' + e.dose : ''}${e.frequency ? ' (' + e.frequency + ')' : ''}`

      // All drugs listed: drug class first, then drug name + dose + frequency
      const allDrugClasses  = [...new Set(g.entries.map(e => e.drugClass))].join('; ')
      const allDrugNames    = g.entries.map(e => e.drugName).join('; ')
      const allDoses        = g.entries.map(e => e.dose || '-').join('; ')
      const allFrequencies  = g.entries.map(e => e.frequency || '-').join('; ')
      const totalDrugs      = g.entries.length

      return humaniseRow({
        participant_code: g.participant_code,
        survey_id: g.survey_id,
        survey_type: g.survey_type,
        submission_date: g.submission_date,
        total_drugs: totalDrugs,
        drug_classes: allDrugClasses,
        drug_names: allDrugNames,
        doses: allDoses,
        frequencies: allFrequencies,
        currently_using_drugs: current.length
          ? current.map(formatEntry).join(' | ')
          : 'None',
        previously_used_drugs: previous.length
          ? previous.map(formatEntry).join(' | ')
          : 'None',
        drug_changed: g.med_changed,
        reason_for_drug_change: g.med_change_reason ?? 'N/A',
      })
    })

    await logExport('medication_details')
    downloadCsv(toCsv(rows), 'diabetax_medications.csv')
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
      desc: 'One row per patient — short-term and long-term side effects in separate columns, all effects listed by name with severity.',
      action: exportSideEffects
    },
    {
      key: 'medications', label: 'Medication Details', icon: '💊',
      desc: 'One row per medication per patient — drug name, drug class, dose, frequency, duration and current status.',
      action: exportMedications
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
