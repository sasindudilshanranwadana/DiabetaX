import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DataTable } from '../../components/ui/DataTable'

interface Participant {
  participant_code: string
  role: string
  created_at: string
  age: number | null
  sex: string | null
  diabetes_type: string | null
}

export function Participants() {
  const [data, setData] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('uid, participant_code, role, created_at')
        .eq('role', 'patient')
        .order('created_at', { ascending: false })

      if (!profiles?.length) { setLoading(false); return }

      const uids = profiles.map(p => p.uid)
      const { data: patients } = await supabase
        .from('patients')
        .select('uid, age, sex, diabetes_type')
        .in('uid', uids)

      const patientMap = Object.fromEntries((patients ?? []).map(p => [p.uid, p]))

      setData(profiles.map(p => ({
        participant_code: p.participant_code ?? '—',
        role: p.role,
        created_at: p.created_at,
        age: patientMap[p.uid]?.age ?? null,
        sex: patientMap[p.uid]?.sex ?? null,
        diabetes_type: patientMap[p.uid]?.diabetes_type ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const columns = [
    { key: 'participant_code', header: 'Participant Code' },
    { key: 'age', header: 'Age', render: (r: Participant) => r.age ? String(r.age) : '—' },
    { key: 'sex', header: 'Sex', render: (r: Participant) => r.sex ?? '—' },
    { key: 'diabetes_type', header: 'Diabetes Type', render: (r: Participant) => r.diabetes_type?.replace('_', ' ') ?? '—' },
    { key: 'created_at', header: 'Registered', render: (r: Participant) => new Date(r.created_at).toLocaleDateString() },
  ]

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Participants</h2>
        <p className="text-gray-400 text-sm">De-identified participant list. All identifiers are replaced with participant codes.</p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchable
        searchKeys={['participant_code']}
        emptyMessage="No participants found."
      />
    </div>
  )
}
