import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))]
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

  async function exportSurveys() {
    setLoading('surveys')
    const { data } = await supabase
      .from('surveys')
      .select('id, survey_type, status, data_source, submitted_at, created_at')
      .eq('status', 'submitted')
    await logExport('normalized_surveys')
    downloadCsv(toCsv((data ?? []) as Record<string, unknown>[]), 'diabetax_surveys.csv')
    setLoading(null)
  }

  async function exportMeasurements() {
    setLoading('measurements')
    const { data } = await supabase.from('measurements').select('*')
    await logExport('normalized_measurements')
    downloadCsv(toCsv((data ?? []) as Record<string, unknown>[]), 'diabetax_measurements.csv')
    setLoading(null)
  }

  async function exportFlat() {
    setLoading('flat')
    const { data } = await supabase.from('ai_training_dataset_v1').select('*')
    await logExport('flat_ml_dataset')
    downloadCsv(toCsv((data ?? []) as Record<string, unknown>[]), 'diabetax_ml_dataset.csv')
    setLoading(null)
  }

  async function exportSideEffects() {
    setLoading('side_effects')
    const { data } = await supabase.from('side_effects').select('*')
    await logExport('normalized_side_effects')
    downloadCsv(toCsv((data ?? []) as Record<string, unknown>[]), 'diabetax_side_effects.csv')
    setLoading(null)
  }

  const exports = [
    { key: 'flat', label: 'Flat ML Dataset', desc: 'One row per survey — all features joined. From ai_training_dataset_v1. Ready for SPSS/Python/R.', icon: '🤖', action: exportFlat },
    { key: 'surveys', label: 'Survey Records', desc: 'Normalised survey metadata (type, status, dates, data_source).', icon: '📋', action: exportSurveys },
    { key: 'measurements', label: 'Measurements', desc: 'All HbA1c and glucose measurements linked by survey_id.', icon: '🩺', action: exportMeasurements },
    { key: 'side_effects', label: 'Side Effects', desc: 'All reported side effects with severity, type and flags.', icon: '⚠️', action: exportSideEffects },
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

      <div className="grid grid-cols-2 gap-4">
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
