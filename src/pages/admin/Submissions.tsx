import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DataTable } from '../../components/ui/DataTable'

interface Row {
  id: string
  participant_code: string
  survey_type: string
  status: string
  data_source: string
  submitted_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  baseline: 'Baseline',
  followup_3m: '3-Month Follow-up',
  followup_6m: '6-Month Follow-up',
}

export function AdminSubmissions() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  useEffect(() => {
    async function load() {
      let q = supabase
        .from('surveys')
        .select('id, uid, survey_type, status, data_source, submitted_at, created_at')
        .order('created_at', { ascending: false })

      if (typeFilter) q = q.eq('survey_type', typeFilter)
      if (statusFilter) q = q.eq('status', statusFilter)
      if (sourceFilter) q = q.eq('data_source', sourceFilter)

      const { data: surveys } = await q
      if (!surveys?.length) { setData([]); setLoading(false); return }

      const uids = [...new Set(surveys.map(s => s.uid))]
      const { data: profiles } = await supabase.from('profiles').select('uid, participant_code').in('uid', uids)
      const codeMap = Object.fromEntries((profiles ?? []).map(p => [p.uid, p.participant_code]))

      setData(surveys.map(s => ({
        id: s.id,
        participant_code: codeMap[s.uid] ?? '—',
        survey_type: s.survey_type,
        status: s.status,
        data_source: s.data_source,
        submitted_at: s.submitted_at,
        created_at: s.created_at,
      })))
      setLoading(false)
    }
    load()
  }, [typeFilter, statusFilter, sourceFilter])

  const columns = [
    { key: 'participant_code', header: 'Participant' },
    { key: 'survey_type', header: 'Survey', render: (r: Row) => TYPE_LABELS[r.survey_type] ?? r.survey_type },
    { key: 'status', header: 'Status', render: (r: Row) => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
        {r.status}
      </span>
    )},
    { key: 'data_source', header: 'Source', render: (r: Row) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.data_source === 'synthetic' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
        {r.data_source}
      </span>
    )},
    { key: 'submitted_at', header: 'Submitted', render: (r: Row) => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Submissions</h2>
        <p className="text-gray-400 text-sm">All survey submissions across the platform.</p>
      </div>

      <div className="flex gap-3">
        {[
          { value: typeFilter, set: setTypeFilter, label: 'Type', opts: [['', 'All types'], ['baseline', 'Baseline'], ['followup_3m', '3-Month'], ['followup_6m', '6-Month']] },
          { value: statusFilter, set: setStatusFilter, label: 'Status', opts: [['', 'All statuses'], ['submitted', 'Submitted'], ['draft', 'Draft']] },
          { value: sourceFilter, set: setSourceFilter, label: 'Source', opts: [['', 'All sources'], ['real', 'Real'], ['synthetic', 'Synthetic']] },
        ].map(f => (
          <select
            key={f.label}
            value={f.value}
            onChange={e => { f.set(e.target.value); setLoading(true) }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary/50 transition-colors"
          >
            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {loading
        ? <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        : <DataTable columns={columns} data={data} searchable searchKeys={['participant_code']} emptyMessage="No submissions found." />
      }
    </div>
  )
}
